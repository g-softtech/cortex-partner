import { NextResponse } from "next/server";
import { requirePartnerSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { kickoffSaveSchema, kickoffSubmitSchema, fileRegistrationSchema } from "@/lib/validations/kickoff";
import { KickoffStatus, NotificationType } from "@prisma/client";
import { notifyAdmins } from "@/lib/notifications";

/**
 * PATCH /api/projects/[id]/kickoff
 *
 * Used by the Partner to either save (auto-save, DRAFT) or submit the kickoff.
 * Query param: ?action=save (default) | ?action=submit
 *
 * Security:
 *  - PARTNER only, IDOR-protected via ownership check
 *  - Partner CANNOT set projectStatus directly
 *  - Submission: kickoff → KICKOFF_SUBMITTED, project → KICKOFF_SUBMITTED (in transaction)
 *
 * GET /api/projects/[id]/kickoff
 *
 * Load the current kickoff data for the partner to resume editing.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
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

  const kickoff = await db.projectKickoff.findFirst({
    where: { project: { id: params.id, partnerId: partner.id } },
    select: {
      id: true,
      status: true,
      businessName: true,
      businessDescription: true,
      primaryColor: true,
      secondaryColor: true,
      brandGuidelines: true,
      contentAbout: true,
      contentServices: true,
      contentProducts: true,
      contactInfo: true,
      socialLinks: true,
      requiredPages: true,
      agreedFeatures: true,
      integrations: true,
      domain: true,
      hostingStatus: true,
      designReferences: true,
      updatedAt: true,
      project: {
        select: {
          files: {
            select: { id: true, originalName: true, fileType: true, fileSize: true, category: true, createdAt: true },
          },
        },
      },
    },
  });

  if (!kickoff) {
    return NextResponse.json({ error: "Kickoff not found." }, { status: 404 });
  }

  return NextResponse.json(kickoff);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
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
  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "save";

  if (!["save", "submit"].includes(action)) {
    return NextResponse.json({ error: "Invalid action. Use 'save' or 'submit'." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  // Use stricter schema for final submission
  const schema = action === "submit" ? kickoffSubmitSchema : kickoffSaveSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  // Load kickoff + project for ownership and status validation
  const kickoff = await db.projectKickoff.findFirst({
    where: { project: { id: params.id, partnerId: partner.id } },
    select: { id: true, status: true, project: { select: { id: true, projectStatus: true, projectNumber: true } } },
  });

  if (!kickoff) {
    return NextResponse.json({ error: "Kickoff not found." }, { status: 404 });
  }

  // Can only edit a DRAFT kickoff
  if (kickoff.status !== KickoffStatus.DRAFT) {
    return NextResponse.json(
      { error: "Kickoff has already been submitted and cannot be modified." },
      { status: 422 }
    );
  }

  const data = parsed.data;

  if (action === "save") {
    // Save draft — just update the kickoff
    const updated = await db.projectKickoff.update({
      where: { id: kickoff.id },
      data,
      select: { id: true, status: true, updatedAt: true },
    });
    return NextResponse.json({ success: true, ...updated });
  }

  // action === "submit": transition kickoff and project atomically
  try {
    const result = await db.$transaction(async (tx) => {
      // Concurrency-safe: only submit if still DRAFT
      const updated = await tx.projectKickoff.updateMany({
        where: { id: kickoff.id, status: KickoffStatus.DRAFT },
        data: { ...data, status: KickoffStatus.SUBMITTED, submittedAt: new Date() },
      });

      if (updated.count === 0) {
        throw new Error("CONCURRENT_MODIFICATION");
      }

      // Update project status to KICKOFF_SUBMITTED — partner cannot set this directly
      await tx.project.update({
        where: { id: kickoff.project.id },
        data: { projectStatus: "KICKOFF_SUBMITTED" },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: "KICKOFF_SUBMITTED",
          entityType: "ProjectKickoff",
          entityId: kickoff.id,
          userId: session.session.user.id,
          metadata: { projectId: kickoff.project.id },
        },
      });

      // Notify Admins
      const dispatchEmails = await notifyAdmins({
        tx,
        type: NotificationType.KICKOFF_UPDATE,
        title: "Kickoff Submitted",
        message: `Partner has submitted the kickoff for project ${kickoff.project.projectNumber}`,
        email: {
          subject: `Kickoff Submitted: ${kickoff.project.projectNumber}`,
          html: `<p>A partner has submitted the kickoff for project <strong>${kickoff.project.projectNumber}</strong>.</p>
          <p>Please log in to the admin dashboard to review.</p>`,
        }
      });

      return { kickoffId: kickoff.id, dispatchEmails };
    });

    await result.dispatchEmails();

    return NextResponse.json({
      success: true,
      kickoffId: result.kickoffId,
      message: "Kickoff submitted successfully. The Cortex team will review it shortly.",
    });
  } catch (err) {
    if (err instanceof Error && err.message === "CONCURRENT_MODIFICATION") {
      return NextResponse.json(
        { error: "Kickoff was modified concurrently. Please refresh and try again." },
        { status: 409 }
      );
    }
    console.error("Kickoff submission failed:", err);
    return NextResponse.json({ error: "Failed to submit kickoff." }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/kickoff/files
 * Register a file in the database AFTER successful direct R2 upload.
 * The partner provides the storageKey returned by /api/files/presign.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = fileRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid file data.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { storageKey, originalName, contentType, fileSize, category } = parsed.data;

  // Verify ownership
  const project = await db.project.findUnique({
    where: { id: params.id },
    select: { id: true, partnerId: true },
  });

  if (!project || project.partnerId !== partner.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  // Register the file in the database
  const file = await db.projectFile.create({
    data: {
      fileName: storageKey.split("/").pop() ?? storageKey,
      originalName,
      fileType: contentType,
      fileSize,
      category,
      storageReference: storageKey,
      projectId: project.id,
      uploadedById: session.session.user.id,
    },
    select: { id: true, originalName: true, fileType: true, fileSize: true, createdAt: true },
  });

  return NextResponse.json({ success: true, file }, { status: 201 });
}
