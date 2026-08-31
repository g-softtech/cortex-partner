import { NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { z } from "zod";

const fileRegistrationSchema = z.object({
  url: z.string().url("Invalid blob URL"),
  originalName: z.string().min(1).max(255),
  fileType: z.string().min(1),
  fileSize: z.number().int().positive(),
});

/**
 * POST /api/support/[id]/files
 *
 * Client-driven DB registration after a successful Vercel Blob upload.
 * Verifies the support ticket belongs to the authenticated partner.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { partner, session } = await requirePartnerSession();

    // 1. Verify the support request exists and belongs to this partner
    const supportRequest = await db.supportRequest.findUnique({
      where: { id: params.id },
      select: { id: true, partnerId: true },
    });

    if (!supportRequest || supportRequest.partnerId !== partner.id) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    // 2. Validate the file metadata payload
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

    const { url, originalName, fileType, fileSize } = parsed.data;

    // 3. Persist the file record
    const fileRecord = await db.supportRequestFile.create({
      data: {
        fileName: originalName,
        originalName,
        fileType,
        fileSize,
        storageReference: url,
        supportRequestId: params.id,
        uploadedById: session.user.id,
      },
      select: {
        id: true,
        originalName: true,
        fileSize: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, file: fileRecord }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error registering support file:", error);
    return NextResponse.json({ error: "Failed to register file." }, { status: 500 });
  }
}
