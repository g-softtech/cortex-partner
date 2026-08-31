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
  let fileType = null;
  let originalName = null;
  let storageReference = null;
  let projectPartnerId = null;

  const projectFile = await db.projectFile.findUnique({
    where: { id: params.id },
    select: {
      storageReference: true,
      originalName: true,
      fileType: true,
      project: { select: { partnerId: true } },
    },
  });

  if (projectFile) {
    fileType = projectFile.fileType;
    originalName = projectFile.originalName;
    storageReference = projectFile.storageReference;
    projectPartnerId = projectFile.project.partnerId;
  } else {
    // Check ChangeRequestFile
    const crFile = await db.changeRequestFile.findUnique({
      where: { id: params.id },
      select: {
        storageReference: true,
        originalName: true,
        fileType: true,
        changeRequest: { select: { project: { select: { partnerId: true } } } },
      },
    });

    if (crFile) {
      fileType = crFile.fileType;
      originalName = crFile.originalName;
      storageReference = crFile.storageReference;
      projectPartnerId = crFile.changeRequest.project.partnerId;
    } else {
      // Check SupportRequestFile
      const supportFile = await db.supportRequestFile.findUnique({
        where: { id: params.id },
        select: {
          storageReference: true,
          originalName: true,
          fileType: true,
          supportRequest: { select: { partner: { select: { id: true } } } },
        },
      });
      if (supportFile) {
        fileType = supportFile.fileType;
        originalName = supportFile.originalName;
        storageReference = supportFile.storageReference;
        projectPartnerId = supportFile.supportRequest.partner.id;
      }
    }
  }

  if (!storageReference || !originalName) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }


  // 3. IDOR check
  if (!isAdmin && ownerId && projectPartnerId !== ownerId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // 4. Proxy the file download
  try {
    const blobResponse = await fetchBlobForProxy(storageReference);
    
    if (!blobResponse.ok) {
      return NextResponse.json({ error: "Upstream file not found." }, { status: 404 });
    }

    // Stream the body to the client
    const headers = new Headers();
    headers.set("Content-Type", fileType || blobResponse.headers.get("content-type") || "application/octet-stream");
    headers.set("Content-Disposition", `inline; filename="${originalName}"`);

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
