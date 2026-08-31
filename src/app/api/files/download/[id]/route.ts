import { NextResponse } from "next/server";
import { requirePartnerSession, requireAdminSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { fetchBlobForProxy } from "@/lib/storage/blob";

/**
 * GET /api/files/download/[id]
 *
 * Streams the requested file to the client to preserve RBAC/IDOR constraints
 * without exposing raw Vercel Blob URLs.
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

  // 2. Load the file record
  const file = await db.projectFile.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      storageReference: true,
      originalName: true,
      fileType: true,
      project: { select: { partnerId: true } },
    },
  });

  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  // 3. IDOR check
  if (!isAdmin && ownerId && file.project.partnerId !== ownerId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // 4. Proxy the file download
  try {
    const blobResponse = await fetchBlobForProxy(file.storageReference);
    
    if (!blobResponse.ok) {
      return NextResponse.json({ error: "Upstream file not found." }, { status: 404 });
    }

    // Stream the body to the client
    const headers = new Headers();
    headers.set("Content-Type", file.fileType || blobResponse.headers.get("content-type") || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${file.originalName}"`);

    return new NextResponse(blobResponse.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Failed to proxy file download:", err);
    return NextResponse.json(
      { error: "Could not download file. Please try again." },
      { status: 500 }
    );
  }
}
