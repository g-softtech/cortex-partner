import { NextResponse } from "next/server";
import { requirePartnerSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const changeFileRegistrationSchema = z.object({
  storageKey: z.string().min(1),
  originalName: z.string().min(1),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

/**
 * POST /api/projects/[id]/changes/[changeId]/files
 * 
 * Registers an uploaded file to a Change Request.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string; changeId: string } }
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

  const parsed = changeFileRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid file data.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { storageKey, originalName, contentType, fileSize } = parsed.data;

  // Verify ownership
  const changeRequest = await db.changeRequest.findUnique({
    where: { id: params.changeId },
    select: { id: true, projectId: true, project: { select: { partnerId: true, projectStatus: true } } },
  });

  if (!changeRequest || changeRequest.projectId !== params.id || changeRequest.project.partnerId !== partner.id) {
    return NextResponse.json({ error: "Change request not found." }, { status: 404 });
  }

  // Register the file in the database
  const file = await db.changeRequestFile.create({
    data: {
      fileName: storageKey.split("/").pop() ?? storageKey,
      originalName,
      fileType: contentType,
      fileSize,
      storageReference: storageKey,
      changeRequestId: changeRequest.id,
      uploadedById: session.session.user.id,
    },
    select: { id: true, originalName: true, fileType: true, fileSize: true, createdAt: true },
  });

  return NextResponse.json({ success: true, file }, { status: 201 });
}
