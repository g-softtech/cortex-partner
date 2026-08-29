import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { adminChangeRequestSchema } from "@/lib/validations/changes";
import { NotificationType } from "@prisma/client";
import { notifyUser } from "@/lib/notifications";

/**
 * PATCH /api/admin/projects/[id]/changes/[changeId]
 * 
 * Allows an Admin to update the status and explanation of a Change Request.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; changeId: string } }
) {
  let session;
  try {
    session = await requireAdminSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = adminChangeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { status, explanation } = parsed.data;

  // Verify the change request exists and belongs to the project
  const changeRequest = await db.changeRequest.findUnique({
    where: { id: params.changeId },
    select: { 
      id: true, 
      projectId: true, 
      status: true,
      project: {
        select: {
          projectNumber: true,
          partner: {
            select: {
              userId: true,
              user: { select: { email: true, name: true } }
            }
          }
        }
      }
    },
  });

  if (!changeRequest || changeRequest.projectId !== params.id) {
    return NextResponse.json({ error: "Change Request not found." }, { status: 404 });
  }

  if (changeRequest.status === status && explanation === undefined) {
    return NextResponse.json({ success: true, message: "No changes made." }, { status: 200 });
  }

  // Atomically update the change request and write to AuditLog
  const updated = await db.$transaction(async (tx) => {
    // We use optimistic concurrency on the status to prevent race conditions
    const result = await tx.changeRequest.updateMany({
      where: {
        id: params.changeId,
        status: changeRequest.status,
      },
      data: {
        status,
        ...(explanation !== undefined && { explanation }),
      },
    });

    if (result.count === 0) {
      throw new Error("Concurrency conflict: Change Request status was modified by another request.");
    }

    const updatedCr = await tx.changeRequest.findUnique({
      where: { id: params.changeId },
    });

    await tx.auditLog.create({
      data: {
        action: "CHANGE_REQUEST_UPDATED",
        entityType: "PROJECT",
        entityId: params.id,
        userId: session.user.id,
        metadata: {
          changeRequestId: params.changeId,
          oldStatus: changeRequest.status,
          newStatus: status,
          explanation,
        },
      },
    });

    return { updatedCr, dispatchEmail: undefined };
  });

  let finalDispatch = () => {};
  if (status !== changeRequest.status) {
    const statusFormatted = status.replace(/_/g, " ");
    const dispatchEmail = await notifyUser({
      tx: db, // Out of transaction here, but it's safe since the db transaction is committed
      userId: changeRequest.project.partner.userId,
      type: NotificationType.CHANGE_REQUEST_UPDATE,
      title: "Change Request Updated",
      message: `Your change request for project ${changeRequest.project.projectNumber} is now ${statusFormatted}`,
      email: {
        to: changeRequest.project.partner.user.email,
        subject: `Change Request Updated: Project ${changeRequest.project.projectNumber}`,
        html: `<p>Hi ${changeRequest.project.partner.user.name},</p>
        <p>Your change request for project <strong>${changeRequest.project.projectNumber}</strong> has been updated to <strong>${statusFormatted}</strong>.</p>
        <p>Please log in to your dashboard to review the details.</p>`,
      }
    });
    finalDispatch = dispatchEmail;
  }

  finalDispatch();

  return NextResponse.json({ success: true, changeRequest: updated.updatedCr });
}
