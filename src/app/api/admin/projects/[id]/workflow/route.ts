import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";
import { adminWorkflowSchema } from "@/lib/validations/workflow";
import { ProjectStatus } from "@prisma/client";

/**
 * PATCH /api/admin/projects/[id]/workflow
 * 
 * Allows an admin to advance the project status through the development lifecycle:
 * READY_FOR_DEVELOPMENT -> DEVELOPMENT -> INTERNAL_QA -> PARTNER_REVIEW
 * FINAL_APPROVAL -> DELIVERED
 * CHANGES -> PARTNER_REVIEW
 */

const ADMIN_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.READY_FOR_DEVELOPMENT]: [ProjectStatus.DEVELOPMENT],
  [ProjectStatus.DEVELOPMENT]: [ProjectStatus.INTERNAL_QA],
  [ProjectStatus.INTERNAL_QA]: [ProjectStatus.PARTNER_REVIEW],
  [ProjectStatus.CHANGES]: [ProjectStatus.PARTNER_REVIEW],
  [ProjectStatus.FINAL_APPROVAL]: [ProjectStatus.DELIVERED],
  // All other states are not managed by this admin endpoint
  [ProjectStatus.SUBMITTED]: [],
  [ProjectStatus.UNDER_REVIEW]: [],
  [ProjectStatus.PRICED]: [],
  [ProjectStatus.PROPOSAL_SENT]: [],
  [ProjectStatus.WON]: [],
  [ProjectStatus.KICKOFF_SUBMITTED]: [],
  [ProjectStatus.PARTNER_REVIEW]: [],
  [ProjectStatus.CUSTOMER_REVIEW]: [],
  [ProjectStatus.DELIVERED]: [],
  [ProjectStatus.SUPPORT]: [],
  [ProjectStatus.LOST]: [],
  [ProjectStatus.CANCELLED]: [],
  [ProjectStatus.ARCHIVED]: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = adminWorkflowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid workflow data.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { newStatus } = parsed.data;

  const currentProject = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, projectStatus: true, projectNumber: true },
  });

  if (!currentProject) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const allowed = ADMIN_TRANSITIONS[currentProject.projectStatus] ?? [];
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

  try {
    const result = await db.$transaction(async (tx) => {
      const updateResult = await tx.project.updateMany({
        where: {
          id: projectId,
          projectStatus: currentProject.projectStatus,
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
          action: "PROJECT_WORKFLOW_ADVANCED",
          entityType: "Project",
          entityId: projectId,
          userId: adminUserId,
          metadata: {
            previousStatus: currentProject.projectStatus,
            newStatus,
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
            "This project was modified by another admin between your read and write. Please reload and try again.",
        },
        { status: 409 }
      );
    }
    console.error("Workflow transaction failed:", err);
    return NextResponse.json(
      { error: "Workflow transition failed. No changes were saved. Please try again." },
      { status: 500 }
    );
  }
}
