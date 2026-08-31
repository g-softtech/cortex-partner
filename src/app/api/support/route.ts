import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { supportSubmissionSchema } from "@/lib/validations/support";
import { requirePartnerSession } from "@/lib/auth/session";
import { notifyAdmins } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";

export async function GET() {
  try {
    const { partner } = await requirePartnerSession();

    const supportRequests = await db.supportRequest.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(supportRequests);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching support requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { partner } = await requirePartnerSession();

    // Rate Limiting: 5 per 5 minutes
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimit = await checkRateLimit(`support_${ip}`, 5, 5 * 60 * 1000);

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = supportSubmissionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid support request data", issues: result.error.errors },
        { status: 400 }
      );
    }

    const validData = result.data;

    // Atomic Sequence Increment & Creation
    const txResult = await db.$transaction(async (tx) => {
      const sequence = await tx.sequence.upsert({
        where: { id: "SUPPORT" },
        update: { value: { increment: 1 } },
        create: { id: "SUPPORT", value: 1 },
      });

      const supportNumber = `SUP-${String(sequence.value).padStart(5, "0")}`;

      const supportRequest = await tx.supportRequest.create({
        data: {
          supportNumber,
          partnerId: partner.id,
          category: validData.category,
          subject: validData.subject,
          description: validData.description,
          status: "OPEN",
          // Link to a specific project if provided
          ...(validData.projectId ? { projectId: validData.projectId } : {}),
        },
      });

      const dispatchEmails = await notifyAdmins({
        tx,
        type: NotificationType.SUPPORT_UPDATE,
        title: "New Support Request",
        message: `Partner has submitted a new support request: ${supportNumber}`,
        email: {
          subject: `New Support Request: ${supportNumber}`,
          html: `<p>A new support request <strong>${supportNumber}</strong> has been submitted.</p>
          <p><strong>Subject:</strong> ${validData.subject}</p>
          <p>Please log in to the admin dashboard to review.</p>`,
        }
      });

      return { supportRequest, dispatchEmails };
    });

    await txResult.dispatchEmails();
    const ticket = txResult.supportRequest;

    return NextResponse.json(
      {
        success: true,
        supportId: ticket.id,
        supportNumber: ticket.supportNumber,
        message: "Support request submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating support request:", error);
    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 }
    );
  }
}
