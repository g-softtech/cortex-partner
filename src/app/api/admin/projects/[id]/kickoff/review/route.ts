import { NextResponse } from "next/server";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";
import { KickoffStatus } from "@prisma/client";

const reviewSchema = z.object({
  decision: z.enum(["APPROVED", "INFORMATION_REQUIRED"]),
  adminNotes: z.string().max(10000).optional(),
});

/**
 * PATCH /api/admin/projects/[id]/kickoff/review
 *
 * Admin reviews a submitted kickoff.
 * - APPROVED: kickoff → APPROVED, project → READY_FOR_DEVELOPMENT (atomic)
 * - INFORMATION_REQUIRED: kickoff → INFORMATION_REQUIRED, project → stays KICKOFF_SUBMITTED,
 *   kickoff status reset to INFORMATION_REQUIRED so partner can resubmit
 * Both update the reviewedAt, reviewedBy fields.
 * AuditLog written in the same transaction.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  let session: Awaited<ReturnType<typeof requireAdminSession>>;
  try {
    session = await requireAdminSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const adminUserId = session.user.id;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review data.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { decision, adminNotes } = parsed.data;

  // Load project + kickoff
  const project = await db.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      projectStatus: true,
      kickoff: { select: { id: true, status: true } },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (!project.kickoff) {
    return NextResponse.json({ error: "No kickoff found for this project." }, { status: 404 });
  }

  if (project.kickoff.status !== KickoffStatus.SUBMITTED) {
    return NextResponse.json(
      {
        error: `Cannot review: kickoff is currently ${project.kickoff.status}. Only SUBMITTED kickoffs can be reviewed.`,
        currentKickoffStatus: project.kickoff.status,
      },
      { status: 422 }
    );
  }

  // Build new statuses based on decision
  const newKickoffStatus = decision === "APPROVED"
    ? KickoffStatus.APPROVED
    : KickoffStatus.INFORMATION_REQUIRED;

  try {
    await db.$transaction(async (tx) => {
      // Concurrency-safe kickoff update
      const updated = await tx.projectKickoff.updateMany({
        where: { id: project.kickoff!.id, status: KickoffStatus.SUBMITTED },
        data: {
          status: newKickoffStatus,
          reviewedAt: new Date(),
          reviewedBy: adminUserId,
          ...(decision === "APPROVED" && { approvedAt: new Date() }),
        },
      });

      if (updated.count === 0) {
        throw new Error("CONCURRENT_MODIFICATION");
      }

      // Update project status if approved
      if (decision === "APPROVED") {
        await tx.project.update({
          where: { id: project.id },
          data: { projectStatus: "READY_FOR_DEVELOPMENT" },
        });
      }

      // Optionally store admin notes on the project
      if (adminNotes) {
        await tx.project.update({
          where: { id: project.id },
          data: { adminNotes },
        });
      }

      // AuditLog
      await tx.auditLog.create({
        data: {
          action: `KICKOFF_${decision}`,
          entityType: "ProjectKickoff",
          entityId: project.kickoff!.id,
          userId: adminUserId,
          metadata: {
            decision,
            previousKickoffStatus: KickoffStatus.SUBMITTED,
            newKickoffStatus,
            projectStatus: decision === "APPROVED" ? "READY_FOR_DEVELOPMENT" : project.projectStatus,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      decision,
      newKickoffStatus,
      projectStatus: decision === "APPROVED" ? "READY_FOR_DEVELOPMENT" : project.projectStatus,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONCURRENT_MODIFICATION") {
      return NextResponse.json(
        { error: "Kickoff was modified concurrently. Please reload and try again." },
        { status: 409 }
      );
    }
    console.error("Kickoff review failed:", err);
    return NextResponse.json({ error: "Failed to process review." }, { status: 500 });
  }
}
