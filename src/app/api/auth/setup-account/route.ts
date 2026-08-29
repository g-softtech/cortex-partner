import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { checkRateLimit } from "@/lib/services/rate-limit";

const setupSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

/**
 * POST /api/auth/setup-account
 * 
 * Completes the partner account setup process.
 * 1. Validates the plaintext token against the stored SHA-256 hash.
 * 2. Enforces expiration and single-use (consumedAt is null).
 * 3. Hashes the new password via bcrypt.
 * 4. Atomically updates the User password and marks the token consumed.
 */
export async function POST(req: Request) {
  try {
    // Basic rate limit: 10 attempts per 15 minutes per IP
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimit = await checkRateLimit(`setup_${ip}`, 10, 15 * 60 * 1000);
    
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many attempts, please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request data.", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { token: plainToken, password } = parsed.data;

    // Hash the incoming token to match the database stored hash
    const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");

    // Lookup token (must exist, not be expired, and not be consumed)
    const setupToken = await db.accountSetupToken.findUnique({
      where: { tokenHash },
    });

    if (!setupToken) {
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    if (setupToken.consumedAt !== null) {
      return NextResponse.json({ error: "This setup link has already been used." }, { status: 401 });
    }

    if (setupToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "This setup link has expired." }, { status: 401 });
    }

    // Token is valid. Hash the new password.
    const hashedPassword = await bcrypt.hash(password, 12);

    // Atomically update user and token
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
    console.error("Setup account failed:", err);
    return NextResponse.json(
      { error: "An error occurred while setting up your account. Please try again." },
      { status: 500 }
    );
  }
}
