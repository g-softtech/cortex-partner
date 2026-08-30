import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/services/rate-limit";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * POST /api/auth/reset-password
 * Validates a reset token and sets a new password.
 * Reuses the AccountSetupToken model (same structure, same security guarantees).
 */
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimit = await checkRateLimit(`reset_${ip}`, 10, 15 * 60 * 1000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request.", issues: parsed.error.errors }, { status: 400 });
    }

    const { token: plainToken, password } = parsed.data;

    const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");

    const setupToken = await db.accountSetupToken.findUnique({ where: { tokenHash } });

    if (!setupToken) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 401 });
    }
    if (setupToken.consumedAt !== null) {
      return NextResponse.json({ error: "This reset link has already been used." }, { status: 401 });
    }
    if (setupToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: setupToken.userId },
        data: { password: hashedPassword },
      });
      await tx.accountSetupToken.update({
        where: { id: setupToken.id },
        data: { consumedAt: new Date() },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}
