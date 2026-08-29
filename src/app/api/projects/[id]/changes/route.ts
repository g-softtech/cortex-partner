import { NextResponse } from "next/server";
import { requirePartnerSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { changeRequestSchema } from "@/lib/validations/changes";
import { ProjectStatus, RequestStatus } from "@prisma/client";

/**
 * POST /api/projects/[id]/changes
 * 
 * Creates a new ChangeRequest for the given project.
 * Restricts creation to projects in DELIVERED or SUPPORT states.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let session;
  try {
    session = await requirePartnerSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { partner } = session;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = changeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { description, files } = parsed.data;

  // Verify ownership and project status
  const project = await db.project.findUnique({
    where: { id: params.id },
    select: { id: true, partnerId: true, projectStatus: true },
  });

  if (!project || project.partnerId !== partner.id) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (
    project.projectStatus !== ProjectStatus.DELIVERED &&
    project.projectStatus !== ProjectStatus.SUPPORT
  ) {
    return NextResponse.json(
      { error: "Change requests can only be submitted for DELIVERED or SUPPORT projects." },
      { status: 403 }
    );
  }

  // Create ChangeRequest and any associated files atomically
  const changeRequest = await db.$transaction(async (tx) => {
    const cr = await tx.changeRequest.create({
      data: {
        description,
        status: RequestStatus.SUBMITTED,
        projectId: project.id,
        ...(files && files.length > 0 && {
          files: {
            create: files.map((f) => ({
              fileName: f.storageKey.split("/").pop() ?? f.storageKey,
              originalName: f.originalName,
              fileType: f.contentType,
              fileSize: f.fileSize,
              storageReference: f.storageKey,
              uploadedById: session.session.user.id,
            })),
          },
        }),
      },
      include: {
        files: true,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CHANGE_REQUEST_SUBMITTED",
        entityType: "PROJECT",
        entityId: project.id,
        userId: session.session.user.id,
        metadata: {
          changeRequestId: cr.id,
          description: cr.description,
          filesCount: files?.length ?? 0,
        },
      },
    });

    return cr;
  });

  return NextResponse.json({ success: true, changeRequest }, { status: 201 });
}
