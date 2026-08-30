import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { partnerApplicationSchema } from "@/lib/validations/partner";
import { ApplicationStatus, NotificationType } from "@prisma/client";
import { notifyAdmins } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (Best-effort in-memory per instance)
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimit = await checkRateLimit(ip, 5, 60 * 1000); // 5 per minute

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // 2. Parse and Validate Input
    const body = await req.json();
    const result = partnerApplicationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid application data", issues: result.error.errors },
        { status: 400 }
      );
    }

    const validData = result.data;

    // 3. Duplicate Check
    // Prevent duplicate PENDING applications.
    // If DECLINED, they can reapply. If MORE_INFORMATION, they shouldn't create a new one.
    const existingApplication = await db.partnerApplication.findFirst({
      where: {
        email: validData.email,
        status: {
          in: [ApplicationStatus.PENDING, ApplicationStatus.MORE_INFORMATION, ApplicationStatus.APPROVED],
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: "An active application with this email already exists." },
        { status: 409 }
      );
    }

    // 4. Atomic Sequence Increment & Application Creation
    // We use a transaction so if creation fails, we rollback (though Prisma handles upsert atomically).
    const application = await db.$transaction(async (tx) => {
      // Safely increment or create the sequence
      const sequence = await tx.sequence.upsert({
        where: { id: "APPLICATION" },
        update: { value: { increment: 1 } },
        create: { id: "APPLICATION", value: 1 },
      });

      const applicationNumber = `CPA-${String(sequence.value).padStart(5, "0")}`;

      return await tx.partnerApplication.create({
        data: {
          ...validData,
          applicationNumber,
          status: ApplicationStatus.PENDING,
        },
      });
    });

    // 5. Notify admins (in-app + email) — outside the transaction so email failure
    //    cannot roll back the successfully saved application.
    const dispatchEmails = await db.$transaction(async (tx) => {
      return await notifyAdmins({
        tx,
        type: NotificationType.APPLICATION_UPDATE,
        title: "New Partner Application",
        message: `A new partner application (${application.applicationNumber}) has been submitted by ${application.name} (${application.email}).`,
        email: {
          subject: `New Partner Application: ${application.applicationNumber}`,
          html: `
            <h2>New Partner Application Received</h2>
            <p>A new partner application has been submitted. Here are the details:</p>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; font-weight: bold;">Application Number</td><td style="padding: 8px;">${application.applicationNumber}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${application.name}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;">${application.email}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Phone</td><td style="padding: 8px;">${application.phone}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Occupation</td><td style="padding: 8px;">${application.occupation}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold;">Has Potential Clients</td><td style="padding: 8px;">${application.hasPotentialClients ? 'Yes' : 'No'}</td></tr>
              ${application.potentialClientType ? `<tr><td style="padding: 8px; font-weight: bold;">Potential Client Type</td><td style="padding: 8px;">${application.potentialClientType}</td></tr>` : ''}
              <tr><td style="padding: 8px; font-weight: bold;">Reason</td><td style="padding: 8px;">${application.reason}</td></tr>
              ${application.source ? `<tr><td style="padding: 8px; font-weight: bold;">Source</td><td style="padding: 8px;">${application.source}</td></tr>` : ''}
            </table>
            <p><a href="${process.env.NEXTAUTH_URL}/admin/partner-applications">Review the application in the admin dashboard →</a></p>
          `,
        },
      });
    });
    await dispatchEmails();

    // We do NOT return the full database object to avoid leaking internal fields like IDs.
    return NextResponse.json(
      {
        success: true,
        applicationNumber: application.applicationNumber,
        message: "Application submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Partner application error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred processing your application." },
      { status: 500 }
    );
  }
}
