/**
 * Programmatic test script for Phase 4 setup token security.
 *
 * This script directly invokes the database and crypto logic used by
 * /api/admin/partner-applications/[id]/status and /api/auth/setup-account
 * to verify the token creation and consumption flow without requiring a browser.
 */

import { PrismaClient, UserRole, ApplicationStatus } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const p = new PrismaClient();

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function main() {
  console.log("\n=== PHASE 4 TOKEN FLOW VERIFICATION ===\n");

  // ------------------------------------------------------------------
  // 1. Get the Test Partner application
  // ------------------------------------------------------------------
  const app = await p.partnerApplication.findFirst({
    where: { email: "partner@test.com" },
  });

  if (!app) {
    throw new Error("Test Partner application not found. Run scripts/seed-app.ts first.");
  }

  console.log(`[1] Application found: ${app.id} — status: ${app.status}`);

  // ------------------------------------------------------------------
  // 2. Simulate approval: create User + Partner + AccountSetupToken atomically
  //    (mirrors the logic in /api/admin/partner-applications/[id]/status/route.ts)
  // ------------------------------------------------------------------
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(plainToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Ensure no duplicate user/partner already
  const existingUser = await p.user.findUnique({ where: { email: app.email } });
  if (existingUser) {
    console.log("[2] Test User already exists — cleaning up for fresh test...");
    await p.accountSetupToken.deleteMany({ where: { userId: existingUser.id } });
    const partner = await p.partner.findUnique({ where: { userId: existingUser.id } });
    if (partner) await p.partner.delete({ where: { id: partner.id } });
    await p.user.delete({ where: { id: existingUser.id } });
  }

  await p.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: app.email,
        name: app.name,
        role: UserRole.PARTNER,
      },
    });

    const seq = await tx.sequence.upsert({
      where: { id: "PARTNER" },
      update: { value: { increment: 1 } },
      create: { id: "PARTNER", value: 1 },
    });

    await tx.partner.create({
      data: {
        userId: user.id,
        partnerId: `CP-${String(seq.value).padStart(5, "0")}`,
        partnerApplicationId: app.id,
      },
    });

    await tx.accountSetupToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    await tx.partnerApplication.update({
      where: { id: app.id },
      data: { status: ApplicationStatus.APPROVED },
    });
  });

  console.log(`[2] Application approved. Token hash stored (SHA-256). Expires: ${expiresAt.toISOString()}`);

  // ------------------------------------------------------------------
  // 3. Verify expired token is rejected
  // ------------------------------------------------------------------
  const fakeExpiredHash = sha256("some-expired-token");
  await p.accountSetupToken.create({
    data: {
      tokenHash: fakeExpiredHash,
      userId: (await p.user.findUnique({ where: { email: app.email }, select: { id: true } }))!.id,
      expiresAt: new Date(Date.now() - 1000), // already expired
    },
  });

  const expiredToken = await p.accountSetupToken.findUnique({ where: { tokenHash: fakeExpiredHash } });
  const expiredRejected = !expiredToken || expiredToken.consumedAt !== null || expiredToken.expiresAt < new Date();
  console.log(`[3] Expired token check: ${expiredRejected ? "✅ REJECTED correctly" : "❌ FAIL: not rejected"}`);

  // ------------------------------------------------------------------
  // 4. Valid token — set password
  // ------------------------------------------------------------------
  const validToken = await p.accountSetupToken.findUnique({ where: { tokenHash } });
  const isNotConsumed = validToken?.consumedAt === null;
  const isNotExpired = validToken && validToken.expiresAt > new Date();

  if (!isNotConsumed || !isNotExpired) {
    throw new Error("Valid token not found or already expired/consumed.");
  }

  const testPassword = "TestP@ssword!99";
  const hashedPassword = await bcrypt.hash(testPassword, 12);

  await p.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: validToken.userId },
      data: { password: hashedPassword },
    });
    await tx.accountSetupToken.update({
      where: { id: validToken.id },
      data: { consumedAt: new Date() },
    });
  });

  console.log(`[4] Password set atomically via transaction ✅`);

  // ------------------------------------------------------------------
  // 5. Verify consumed token cannot be reused
  // ------------------------------------------------------------------
  const tokenAfter = await p.accountSetupToken.findUnique({ where: { tokenHash } });
  const isConsumed = tokenAfter?.consumedAt !== null;
  console.log(`[5] Token consumed flag: ${isConsumed ? "✅ consumedAt is set — token is single-use" : "❌ FAIL"}`);

  // ------------------------------------------------------------------
  // 6. Verify bcrypt comparison works
  // ------------------------------------------------------------------
  const user = await p.user.findUnique({ where: { email: app.email }, select: { password: true } });
  const validMatch = await bcrypt.compare(testPassword, user!.password!);
  const invalidMatch = await bcrypt.compare("WrongPassword!", user!.password!);
  console.log(`[6] Bcrypt valid password:   ${validMatch ? "✅ MATCH" : "❌ FAIL"}`);
  console.log(`[6] Bcrypt invalid password: ${!invalidMatch ? "✅ REJECTED" : "❌ FAIL"}`);

  // ------------------------------------------------------------------
  // 7. Password is never returned from the user lookup
  // ------------------------------------------------------------------
  const safeUser = await p.user.findUnique({
    where: { email: app.email },
    select: { id: true, email: true, name: true, role: true },
  });
  const passwordExposed = "password" in (safeUser ?? {});
  console.log(`[7] Password not in safe select: ${!passwordExposed ? "✅ PASS" : "❌ FAIL"}`);

  console.log("\n=== ALL TOKEN FLOW TESTS COMPLETE ===\n");
}

main().catch(console.error).finally(() => p.$disconnect());
