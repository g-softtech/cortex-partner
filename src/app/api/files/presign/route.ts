import { NextResponse } from "next/server";
import { requirePartnerSession, requireAdminSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { generatePresignedUploadUrl } from "@/lib/storage/s3";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Allowed MIME types and mapping to explicit safe extensions
const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "application/zip": "zip",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

const presignSchema = z.object({
  projectId: z.string().min(1),
  changeRequestId: z.string().optional(),
  fileName: z.string().min(1).max(255),
  contentType: z.string().refine((val) => Object.keys(ALLOWED_MIME_TYPES).includes(val), {
    message: "File type not allowed.",
  }),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE, {
    message: "File size must not exceed 10 MB.",
  }),
  category: z.enum(["LOGO", "IMAGE", "DOCUMENT", "BRAND_GUIDELINES", "OTHER"]).optional(),
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

  // Rate limit: 20 uploads per minute per IP
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const rateLimit = await checkRateLimit(`presign_${ip}`, 20, 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many upload requests" }, { status: 429 });
  }

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

  const { projectId, changeRequestId, contentType } = parsed.data;

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

  if (changeRequestId) {
    // 2.5 Verify ChangeRequest exists and belongs to this project
    const changeRequest = await db.changeRequest.findUnique({
      where: { id: changeRequestId },
      select: { projectId: true }
    });

    if (!changeRequest || changeRequest.projectId !== projectId) {
      return NextResponse.json({ error: "Invalid change request." }, { status: 404 });
    }
  }

  // 3. Generate a unique storage key (never expose structure that leaks data)
  // SECURITY: Ignore the client-provided extension. 
  // Force the extension to match the validated contentType's known safe extension.
  // This prevents an attacker from sending contentType="image/jpeg" but fileName="virus.exe"
  const safeExt = ALLOWED_MIME_TYPES[contentType] ?? "bin";
  const prefix = changeRequestId ? `changes/${changeRequestId}` : `projects/${project.id}`;
  const storageKey = `${prefix}/${uuidv4()}.${safeExt}`;

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
