import { NextResponse } from "next/server";
import { requirePartnerSession, requireAdminSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatePresignedUploadUrl } from "@/lib/storage/s3";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Allowed MIME types and max file size (10 MB)
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

const presignSchema = z.object({
  projectId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  contentType: z.string().refine((val) => ALLOWED_MIME_TYPES.includes(val), {
    message: "File type not allowed.",
  }),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, {
    message: "File size must not exceed 10 MB.",
  }),
  category: z.enum(["LOGO", "IMAGE", "DOCUMENT", "BRAND_GUIDELINES", "OTHER"]),
});

/**
 * POST /api/files/presign
 *
 * Issues a presigned PUT URL for direct-to-R2 upload.
 * Validates project ownership before issuing the URL.
 * Supports both PARTNER (own projects only) and ADMIN (any project).
 * NEVER exposes R2 credentials to the browser.
 */
export async function POST(req: Request) {
  // 1. Try Partner auth first, then Admin
  let isAdmin = false;
  let ownerId: string | null = null; // partnerId for partner auth

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { projectId, fileName, contentType } = parsed.data;

  // Try partner auth first
  try {
    const { partner } = await requirePartnerSession();
    ownerId = partner.id;
  } catch (partnerErr) {
    // Not a partner - try admin
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

  // 2. Verify project existence and ownership
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, partnerId: true, projectNumber: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  // Partners can only upload to their own projects
  if (!isAdmin && ownerId && project.partnerId !== ownerId) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  // 3. Generate a unique storage key (never expose structure that leaks data)
  const ext = fileName.split(".").pop() ?? "bin";
  const storageKey = `projects/${project.id}/${uuidv4()}.${ext}`;

  // 4. Generate the presigned URL
  try {
    const presignedUrl = await generatePresignedUploadUrl(storageKey, contentType);

    return NextResponse.json({
      uploadUrl: presignedUrl,
      storageKey,
      expiresIn: 3600,
    });
  } catch (err) {
    console.error("Failed to generate presigned upload URL:", err);
    return NextResponse.json(
      { error: "Could not generate upload URL. Please try again." },
      { status: 500 }
    );
  }
}
