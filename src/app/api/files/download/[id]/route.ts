import { NextResponse } from "next/server";
import { requirePartnerSession, requireAdminSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatePresignedDownloadUrl } from "@/lib/storage/s3";

/**
 * GET /api/files/download/[id]
 *
 * Issues a short-lived presigned GET URL for an uploaded file.
 * - Partners can only download files belonging to their own projects.
 * - Admins can download any file.
 * - Never exposes the raw R2 key or credentials.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // 1. Try partner auth, fall back to admin
  let isAdmin = false;
  let ownerId: string | null = null;

  try {
    const { partner } = await requirePartnerSession();
    ownerId = partner.id;
  } catch (partnerErr) {
    try {
      await requireAdminSession();
      isAdmin = true;
    } catch {
      if (isAuthError(partnerErr)) {
        return NextResponse.json({ error: partnerErr.message }, { status: partnerErr.status });
      }
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  // 2. Load the file record (always use explicit select)
  const file = await db.projectFile.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      storageReference: true,
      originalName: true,
      project: { select: { partnerId: true } },
    },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  // 3. IDOR check — partners only see their own project's files
  if (!isAdmin && ownerId && file.project.partnerId !== ownerId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // 4. Generate presigned download URL (1 hour expiry)
  try {
    const downloadUrl = await generatePresignedDownloadUrl(file.storageReference);
    return NextResponse.json({ downloadUrl, fileName: file.originalName });
  } catch (err) {
    console.error("Failed to generate presigned download URL:", err);
    return NextResponse.json(
      { error: "Could not generate download URL. Please try again." },
      { status: 500 }
    );
  }
}
