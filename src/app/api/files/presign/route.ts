import { NextResponse } from "next/server";
import { requirePartnerSession, requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { z } from "zod";
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

const clientPayloadSchema = z.discriminatedUnion("uploadType", [
  // Project file (kickoff, change request)
  z.object({
    uploadType: z.literal("project"),
    projectId: z.string().min(1),
    changeRequestId: z.string().optional(),
  }),
  // Support request attachment
  z.object({
    uploadType: z.literal("support"),
    supportRequestId: z.string().min(1),
  }),
]);

/**
 * POST /api/files/presign
 *
 * Implements Vercel Blob's handleUpload endpoint to securely issue 
 * client upload tokens. Preserves all original RBAC/IDOR checks.
 */
export async function POST(req: Request) {
  // Rate limit: 20 uploads per minute per IP
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const rateLimit = await checkRateLimit(`presign_${ip}`, 20, 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many upload requests" }, { status: 429 });
  }

  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let parsedPayload: Record<string, unknown> = {};
        if (clientPayload) {
          try {
            parsedPayload = JSON.parse(clientPayload) as Record<string, unknown>;
          } catch {
            throw new Error("Invalid client payload JSON");
          }
        }
        
        const parsed = clientPayloadSchema.safeParse(parsedPayload);
        if (!parsed.success) {
          throw new Error("Invalid client payload format.");
        }

        // 1. Try Partner auth first, then Admin
        let isAdmin = false;
        let ownerId: string | null = null;

        try {
          const { partner } = await requirePartnerSession();
          ownerId = partner.id;
        } catch {
          try {
            await requireAdminSession();
            isAdmin = true;
          } catch {
            throw new Error("Unauthorized.");
          }
        }

        if (parsed.data.uploadType === "support") {
          // Support request upload — verify ownership
          const { supportRequestId } = parsed.data;
          const supportReq = await db.supportRequest.findUnique({
            where: { id: supportRequestId },
            select: { id: true, partner: { select: { id: true } } },
          });
          if (!supportReq) throw new Error("Support request not found.");
          if (!isAdmin && ownerId && supportReq.partner.id !== ownerId) {
            throw new Error("Not found.");
          }
          return {
            allowedContentTypes: [
              "image/jpeg", "image/png", "image/gif", "image/webp",
              "application/pdf",
            ],
            maximumSizeInBytes: 10 * 1024 * 1024,
            tokenPayload: JSON.stringify({ uploadType: "support", supportRequestId }),
          };
        }

        // Project upload (existing logic)
        const { projectId, changeRequestId } = parsed.data;

        // 2. Verify project existence and ownership
        const project = await db.project.findUnique({
          where: { id: projectId },
          select: { id: true, partnerId: true, projectNumber: true },
        });

        if (!project) {
          throw new Error("Project not found.");
        }

        // Partners can only upload to their own projects
        if (!isAdmin && ownerId && project.partnerId !== ownerId) {
          throw new Error("Not found.");
        }

        if (changeRequestId) {
          // 2.5 Verify ChangeRequest exists and belongs to this project
          const changeRequest = await db.changeRequest.findUnique({
            where: { id: changeRequestId },
            select: { projectId: true }
          });

          if (!changeRequest || changeRequest.projectId !== projectId) {
            throw new Error("Invalid change request.");
          }
        }

        // Validated successfully. 
        // Vercel Blob handles filename/path naming and content-types safely via its internal rules,
        // but we return the validated tokenPayload if needed.
        return {
          allowedContentTypes: [
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
            "application/zip"
          ],
          maximumSizeInBytes: 10 * 1024 * 1024,
          tokenPayload: JSON.stringify({ uploadType: "project", projectId, changeRequestId })
        };
      },
      onUploadCompleted: async () => {
        // We strictly adhere to Client-Driven Database Registration.
        // No DB writes are performed here.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = (error as Error).message;
    console.error("Vercel Blob token generation failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
