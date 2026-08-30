import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/services/rate-limit";
import { notifyUser } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/forgot-password
 * Generates a secure password reset token and sends a reset email.
 * Always returns 200 regardless of whether the email exists (prevents user enumeration).
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimit = await checkRateLimit(`forgot_${ip}`, 5, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ success: true }); // Silent rate limit — no enumeration
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: true }); // Silent — same response regardless
    }

    const { email } = parsed.data;

    // Look up user — must exist and have a password (i.e. not OAuth-only)
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    });

    // Always return success to prevent user enumeration
    if (!user || !user.password) {
      return NextResponse.json({ success: true });
    }

    // Generate a cryptographically secure token
    const plainToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate any existing unused reset tokens for this user, then create a new one
    const dispatchEmail = await db.$transaction(async (tx) => {
      // Mark old tokens as consumed so only one valid token exists at a time
      await tx.accountSetupToken.updateMany({
        where: {
          userId: user.id,
          consumedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { consumedAt: new Date() },
      });

      // Store the new hashed token
      await tx.accountSetupToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${plainToken}`;

      return await notifyUser(
        {
          tx,
          userId: user.id,
          type: NotificationType.SYSTEM,
          title: "Password Reset Requested",
          message: "A password reset was requested for your account.",
          email: {
            to: user.email,
            subject: "Reset Your Cortex Partner Portal Password",
            html: `
              <p>Hi ${user.name ?? "there"},</p>
              <p>We received a request to reset the password for your Cortex Partner Portal account.</p>
              <p>Click the link below to set a new password. This link expires in <strong>1 hour</strong>.</p>
              <p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">Reset My Password</a></p>
              <p>If you did not request a password reset, you can safely ignore this email — your password will not change.</p>
              <p style="color:#6b7280;font-size:12px;">For security, this link can only be used once and expires in 1 hour.</p>
            `,
          },
        },
        true // skipInApp — password resets don't need in-app notifications
      );
    });

    dispatchEmail();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Forgot password error:", err);
    // Still return 200 to prevent enumeration
    return NextResponse.json({ success: true });
  }
}
