import { NextResponse } from "next/server";
import { requirePartnerSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";

/**
 * PATCH /api/projects/[id]/accept
 *
 * Partner accepts the proposal for a project:
 *   - Enforces authentication (PARTNER only)
 *   - Enforces ownership (project must belong to this partner)
 *   - Enforces current status is exactly PROPOSAL_SENT
 *   - Atomically in ONE transaction:
 *       1. Updates project.projectStatus = WON
 *       2. Creates ProjectKickoff with status = DRAFT
 *       3. Writes AuditLog
 *   - Never accepts any user-provided status, partnerId, or other sensitive field
 */
export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // 1. Require PARTNER auth
  let session: Awaited<ReturnType<typeof requirePartnerSession>>;
  try {
    session = await requirePartnerSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const { partner } = session;
  const projectId = params.id;

  // 2. Load the project for ownership + status validation
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, partnerId: true, projectStatus: true, projectNumber: true },
  });

  // Return 404 for any IDOR attempt — do not reveal that the project exists
  if (!project || project.partnerId !== partner.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  // 3. Enforce the exact required current status
  if (project.projectStatus !== "PROPOSAL_SENT") {
    return NextResponse.json(
      {
        error: `Cannot accept: project is currently ${project.projectStatus}. Only PROPOSAL_SENT projects can be accepted.`,
        currentStatus: project.projectStatus,
      },
      { status: 422 }
    );
  }

  // 4. Atomic transaction: update project + create kickoff + audit
  try {
    const result = await db.$transaction(async (tx) => {
      // Optimistic concurrency: ensure status hasn't changed since we read it
      const updated = await tx.project.updateMany({
        where: { id: projectId, projectStatus: "PROPOSAL_SENT" },
        data: { projectStatus: "WON" },
      });

      if (updated.count === 0) {
        throw new Error("CONCURRENT_MODIFICATION");
      }

      // Create the initial kickoff record in DRAFT state
      // businessName and businessDescription are required in the schema;
      // we use empty string defaults here so the partner fills them in the kickoff form.
      const kickoff = await tx.projectKickoff.create({
        data: {
          projectId,
          status: "DRAFT",
          businessName: "",
          businessDescription: "",
        },
        select: { id: true },
      });

      // Write AuditLog
      await tx.auditLog.create({
        data: {
          action: "PROJECT_ACCEPTED",
          entityType: "Project",
          entityId: projectId,
          userId: session.session.user.id,
          metadata: {
            previousStatus: "PROPOSAL_SENT",
            newStatus: "WON",
            kickoffId: kickoff.id,
          },
        },
      });

      return { projectNumber: project.projectNumber, kickoffId: kickoff.id };
    });

    return NextResponse.json({
      success: true,
      projectNumber: result.projectNumber,
      kickoffId: result.kickoffId,
      message: "Proposal accepted. You can now submit your kickoff details.",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONCURRENT_MODIFICATION") {
      return NextResponse.json(
        { error: "Project status changed during acceptance. Please refresh and try again." },
        { status: 409 }
      );
    }
    console.error("Project acceptance failed:", err);
    return NextResponse.json(
      { error: "Failed to accept proposal. Please try again." },
      { status: 500 }
    );
  }
}
