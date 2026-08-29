import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { adminChangeRequestSchema } from "@/lib/validations/changes";

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
    select: { id: true, projectId: true, status: true },
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

    return updatedCr;
  });

  return NextResponse.json({ success: true, changeRequest: updated });
}
