import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";
import { assessmentSchema } from "@/lib/validations/assessment";
import { ProjectStatus, NotificationType } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { notifyUser } from "@/lib/notifications";

/**
 * PATCH /api/admin/projects/[id]/assess
 *
 * Allows an admin to assess a partner project:
 *   - Set partnerPrice (accepted as decimal string, stored as Prisma Decimal)
 *   - Set estimatedTimeline, scope, adminNotes
 *   - Set opportunityStatus
 *   - Transition projectStatus via the server-enforced state machine
 *
 * CONCURRENCY SAFETY:
 *   The update WHERE clause includes the project's current status at time of read.
 *   If another admin changed the status between our read and our write,
 *   the updateMany will match 0 rows and we return 409 Conflict.
 *   This prevents silent race conditions.
 *
 * AUDIT:
 *   AuditLog is written in the SAME transaction as the project update.
 *   If either fails, both are rolled back.
 *
 * Authorization: ADMIN only (enforced here, not just in middleware).
 */

// State machine: maps current status → allowed next statuses
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.SUBMITTED]:            [ProjectStatus.UNDER_REVIEW, ProjectStatus.LOST, ProjectStatus.CANCELLED],
  [ProjectStatus.UNDER_REVIEW]:         [ProjectStatus.PRICED, ProjectStatus.SUBMITTED, ProjectStatus.LOST, ProjectStatus.CANCELLED],
  [ProjectStatus.PRICED]:               [ProjectStatus.PROPOSAL_SENT, ProjectStatus.UNDER_REVIEW, ProjectStatus.LOST, ProjectStatus.CANCELLED],
  [ProjectStatus.PROPOSAL_SENT]:        [ProjectStatus.WON, ProjectStatus.LOST, ProjectStatus.CANCELLED],
  [ProjectStatus.WON]:                  [ProjectStatus.KICKOFF_SUBMITTED],
  [ProjectStatus.KICKOFF_SUBMITTED]:    [ProjectStatus.READY_FOR_DEVELOPMENT],
  [ProjectStatus.READY_FOR_DEVELOPMENT]:[ProjectStatus.DEVELOPMENT],
  [ProjectStatus.DEVELOPMENT]:          [ProjectStatus.INTERNAL_QA],
  [ProjectStatus.INTERNAL_QA]:          [ProjectStatus.PARTNER_REVIEW],
  [ProjectStatus.PARTNER_REVIEW]:       [ProjectStatus.CUSTOMER_REVIEW, ProjectStatus.CHANGES],
  [ProjectStatus.CUSTOMER_REVIEW]:      [ProjectStatus.FINAL_APPROVAL, ProjectStatus.CHANGES],
  [ProjectStatus.CHANGES]:              [ProjectStatus.PARTNER_REVIEW, ProjectStatus.CUSTOMER_REVIEW],
  [ProjectStatus.FINAL_APPROVAL]:       [ProjectStatus.DELIVERED],
  [ProjectStatus.DELIVERED]:            [ProjectStatus.SUPPORT, ProjectStatus.ARCHIVED],
  [ProjectStatus.SUPPORT]:              [ProjectStatus.ARCHIVED],
  // Terminal states: no outgoing transitions allowed
  [ProjectStatus.LOST]:                 [],
  [ProjectStatus.CANCELLED]:            [],
  [ProjectStatus.ARCHIVED]:             [],
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 1. Auth guard — independent of middleware
  let session;
  try {
    session = await requireAdminSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const adminUserId = session.user.id;
  const { id: projectId } = params;

  // 2. Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = assessmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid assessment data.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { partnerPrice, estimatedTimeline, scope, adminNotes, opportunityStatus, newStatus } =
    parsed.data;

  // 3. Load current project (outside transaction — just to validate existence and get current status)
  const currentProject = await db.project.findUnique({
    where: { id: projectId },
    select: { 
      id: true, 
      projectStatus: true, 
      projectNumber: true,
      partner: {
        select: {
          userId: true,
          user: { select: { email: true, name: true } }
        }
      }
    },
  });

  if (!currentProject) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  // 4. Validate state machine transition (if a new status was requested)
  if (newStatus !== undefined) {
    const allowed = VALID_TRANSITIONS[currentProject.projectStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid transition: cannot move from ${currentProject.projectStatus} to ${newStatus}.`,
          currentStatus: currentProject.projectStatus,
          allowedTransitions: allowed,
        },
        { status: 422 }
      );
    }
  }

  // 5. Build the update data object — only include provided fields
  const updateData: Record<string, unknown> = {};
  if (estimatedTimeline !== undefined) updateData.estimatedTimeline = estimatedTimeline;
  if (scope !== undefined)             updateData.scope = scope;
  if (adminNotes !== undefined)        updateData.adminNotes = adminNotes;
  if (opportunityStatus !== undefined) updateData.opportunityStatus = opportunityStatus;
  if (newStatus !== undefined)         updateData.projectStatus = newStatus;
  // Convert decimal string to Prisma Decimal safely
  if (partnerPrice !== undefined) {
    updateData.partnerPrice = new Decimal(partnerPrice);
  }

  // If nothing was actually sent, reject early
  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No assessment fields provided." },
      { status: 400 }
    );
  }

  // 6. Atomic transaction: update + audit log
  // CONCURRENCY SAFETY: The WHERE clause includes the previously-read projectStatus.
  // If another admin already changed the status, updateMany returns count=0 → 409 Conflict.
  try {
    const result = await db.$transaction(async (tx) => {
      // Optimistic concurrency: update only if status hasn't changed since we read it
      const updateResult = await tx.project.updateMany({
        where: {
          id: projectId,
          projectStatus: currentProject.projectStatus, // Prevents stale-read race
        },
        data: updateData,
      });

      if (updateResult.count === 0) {
        // Row exists but status changed between our read and write
        throw new Error("CONCURRENT_MODIFICATION");
      }

      // Fetch the updated project for the response (minimal safe fields only)
      const updated = await tx.project.findUnique({
        where: { id: projectId },
        select: { projectNumber: true, projectStatus: true, updatedAt: true },
      });

      // Write AuditLog in the same transaction
      await tx.auditLog.create({
        data: {
          action: "PROJECT_ASSESSED",
          entityType: "Project",
          entityId: projectId,
          userId: adminUserId,
          metadata: {
            changedFields: Object.keys(updateData),
            previousStatus: currentProject.projectStatus,
            newStatus: newStatus ?? currentProject.projectStatus,
          },
        },
      });

      // Dispatch Notification if status changed
      let dispatchEmail = () => {};
      if (newStatus !== undefined && newStatus !== currentProject.projectStatus) {
        const statusFormatted = newStatus.replace(/_/g, " ");
        dispatchEmail = await notifyUser({
          tx,
          userId: currentProject.partner.userId,
          type: NotificationType.PROJECT_UPDATE,
          title: "Project Status Updated",
          message: `Your project ${currentProject.projectNumber} is now ${statusFormatted}.`,
          email: {
            to: currentProject.partner.user.email,
            subject: `Cortex Partner - Project ${currentProject.projectNumber} Updated`,
            html: `<p>Hi ${currentProject.partner.user.name},</p>
            <p>Your project <strong>${currentProject.projectNumber}</strong> has been updated to <strong>${statusFormatted}</strong>.</p>
            <p>Log in to your partner dashboard to view the latest assessment and details.</p>`,
          }
        });
      }

      return { updated, dispatchEmail };
    });

    // Fire the email after transaction succeeds
    result.dispatchEmail();

    // Return only safe, admin-appropriate summary fields
    // partnerPrice and adminNotes are NOT echoed back in response
    return NextResponse.json({
      success: true,
      projectNumber: result.updated?.projectNumber,
      projectStatus: result.updated?.projectStatus,
      updatedAt: result.updated?.updatedAt,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONCURRENT_MODIFICATION") {
      return NextResponse.json(
        {
          error:
            "This project was modified by another admin between your read and write. Please reload and try again.",
        },
        { status: 409 }
      );
    }
    console.error("Assessment transaction failed:", err);
    return NextResponse.json(
      { error: "Assessment failed. No changes were saved. Please try again." },
      { status: 500 }
    );
  }
}
