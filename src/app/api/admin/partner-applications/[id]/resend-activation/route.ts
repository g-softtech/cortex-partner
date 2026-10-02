import { NextResponse } from "next/server";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ApplicationStatus, NotificationType } from "@prisma/client";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { notifyUser } from "@/lib/notifications";
import crypto from "crypto";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let adminSession;
  try {
    adminSession = await requireAdminSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const { id } = params;

  // Enforce rate limit (max 3 resend attempts per application per 15 minutes)
  const rateLimit = await checkRateLimit(`resend_act_${id}`, 3, 15 * 60 * 1000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many resend attempts. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  const application = await db.partnerApplication.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      name: true,
      email: true,
      partner: {
        select: {
          id: true,
          partnerId: true,
          user: {
            select: {
              id: true,
              password: true,
              setupTokens: {
                select: {
                  consumedAt: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.status !== ApplicationStatus.APPROVED) {
    return NextResponse.json(
      { error: "Only approved applications can have an activation link resent." },
      { status: 400 }
    );
  }

  if (!application.partner || !application.partner.user) {
    return NextResponse.json(
      { error: "Associated partner user account not found." },
      { status: 400 }
    );
  }

  const user = application.partner.user;
  const isActivated =
    user.password !== null ||
    user.setupTokens.some((t) => t.consumedAt !== null);

  if (isActivated) {
    return NextResponse.json(
      { error: "Account setup has already been completed for this partner." },
      { status: 400 }
    );
  }

  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Invalidate all previous setup tokens for this user
      await tx.accountSetupToken.deleteMany({
        where: { userId: user.id },
      });

      // 2. Create fresh setup token
      await tx.accountSetupToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      });

      // 3. Write AuditLog
      await tx.auditLog.create({
        data: {
          action: "PARTNER_ACTIVATION_LINK_RESENT",
          entityType: "PartnerApplication",
          entityId: id,
          userId: adminSession.user.id,
          metadata: {
            partnerId: application.partner!.partnerId,
            recipientEmail: application.email,
          },
        },
      });

      // 4. Notify user via email
      const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/setup-account?token=${plainToken}`;
      const dispatchEmail = await notifyUser({
        tx,
        userId: user.id,
        type: NotificationType.APPLICATION_UPDATE,
        title: "Account Setup Link Resent",
        message: "Your partner account activation link has been resent.",
        email: {
          to: application.email,
          subject: "Cortex Partner Program - Complete Your Account Setup",
          html: `<p>Hi ${application.name},</p><p>Your account setup link has been resent. Click below to activate your account:</p><p><a href="${setupUrl}">Set up my account</a></p><p>This link expires in 72 hours.</p>`,
        },
      });

      return { dispatchEmail };
    });

    await result.dispatchEmail();

    return NextResponse.json({
      success: true,
      message: "Activation link resent successfully.",
    });
  } catch (err) {
    console.error("Resend activation link failed:", err);
    return NextResponse.json(
      { error: "Failed to resend activation link. Please try again." },
      { status: 500 }
    );
  }
}
