import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePartnerSession, isAuthError } from "@/lib/auth/session";
import { partnerReviewSchema } from "@/lib/validations/workflow";
import { ProjectStatus } from "@prisma/client";

/**
 * PATCH /api/projects/[id]/review
 * 
 * Allows a partner to review the project during PARTNER_REVIEW and CUSTOMER_REVIEW.
 * - APPROVE: PARTNER_REVIEW -> CUSTOMER_REVIEW
 * - APPROVE: CUSTOMER_REVIEW -> FINAL_APPROVAL
 * - REPORT_ISSUE: PARTNER_REVIEW -> CHANGES (or CUSTOMER_REVIEW -> CHANGES)
 */

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let authResult;
  try {
    authResult = await requirePartnerSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const { session, partner } = authResult;
  const partnerUserId = session.user.id;
  const partnerId = partner.id;
  const { id: projectId } = params;

  if (!partnerId) {
    return NextResponse.json({ error: "Partner profile not found." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = partnerReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review data.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { action, issueDescription } = parsed.data;

  // Enforce IDOR protection here
  const currentProject = await db.project.findFirst({
    where: { 
      id: projectId,
      partnerId: partnerId // Explicit ownership check
    },
    select: { id: true, projectStatus: true, projectNumber: true },
  });

  if (!currentProject) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const currentStatus = currentProject.projectStatus;

  if (currentStatus !== ProjectStatus.PARTNER_REVIEW && currentStatus !== ProjectStatus.CUSTOMER_REVIEW) {
    return NextResponse.json(
      { error: `Cannot review project in current status (${currentStatus}).` },
      { status: 422 }
    );
  }

  let newStatus: ProjectStatus;

  if (action === "APPROVE") {
    if (currentStatus === ProjectStatus.PARTNER_REVIEW) {
      newStatus = ProjectStatus.CUSTOMER_REVIEW;
    } else {
      // Must be CUSTOMER_REVIEW
      newStatus = ProjectStatus.FINAL_APPROVAL;
    }
  } else {
    // REPORT_ISSUE
    newStatus = ProjectStatus.CHANGES;
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const updateResult = await tx.project.updateMany({
        where: {
          id: projectId,
          projectStatus: currentProject.projectStatus,
          partnerId: partnerId,
        },
        data: {
          projectStatus: newStatus,
        },
      });

      if (updateResult.count === 0) {
        throw new Error("CONCURRENT_MODIFICATION");
      }

      const updated = await tx.project.findUnique({
        where: { id: projectId },
        select: { projectNumber: true, projectStatus: true, updatedAt: true },
      });

      await tx.auditLog.create({
        data: {
          action: action === "APPROVE" ? "PROJECT_APPROVED" : "ISSUE_REPORTED",
          entityType: "Project",
          entityId: projectId,
          userId: partnerUserId,
          metadata: {
            previousStatus: currentProject.projectStatus,
            newStatus,
            issueDescription: action === "REPORT_ISSUE" ? issueDescription : undefined,
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      projectNumber: result?.projectNumber,
      projectStatus: result?.projectStatus,
      updatedAt: result?.updatedAt,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONCURRENT_MODIFICATION") {
      return NextResponse.json(
        {
          error:
            "This project was modified recently. Please reload and try again.",
        },
        { status: 409 }
      );
    }
    console.error("Partner review transaction failed:", err);
    return NextResponse.json(
      { error: "Review failed. No changes were saved. Please try again." },
      { status: 500 }
    );
  }
}
