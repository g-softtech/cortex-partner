import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";
import { ApplicationStatus, UserRole, NotificationType } from "@prisma/client";
import { z } from "zod";
import crypto from "crypto";
import { notifyUser } from "@/lib/notifications";

/**
 * PATCH /api/admin/partner-applications/[id]/status
 *
 * Performs a status transition on a PartnerApplication.
 * Enforces the server-side state machine — UI cannot bypass this.
 *
 * VALID TRANSITIONS:
 *   PENDING          → APPROVED | DECLINED | MORE_INFORMATION
 *   MORE_INFORMATION → APPROVED | DECLINED
 *   APPROVED         → (terminal — no further transitions)
 *   DECLINED         → (terminal — no further transitions)
 *
 * APPROVAL TRANSACTION (atomic — all-or-nothing):
 *   1. Increment PARTNER sequence → CP-XXXXX
 *   2. Check for existing User with same email (prevent duplicate)
 *   3. Create User (role: PARTNER, no password yet)
 *   4. Create Partner (with CP-XXXXX partnerId)
 *   5. Generate cryptographically secure random setup token
 *   6. Store SHA-256 hash of token in AccountSetupToken (72h expiry)
 *   7. Set application status → APPROVED
 *
 * The plaintext setup token is returned ONCE in the API response so
 * Phase 4 can include it in the setup-account email link.
 * It is never stored in plaintext.
 *
 * Authorization: ADMIN only.
 */

const patchSchema = z.object({
  status: z.enum([
    ApplicationStatus.APPROVED,
    ApplicationStatus.DECLINED,
    ApplicationStatus.MORE_INFORMATION,
  ]),
});

// Valid state machine transitions
const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  [ApplicationStatus.PENDING]: [
    ApplicationStatus.APPROVED,
    ApplicationStatus.DECLINED,
    ApplicationStatus.MORE_INFORMATION,
  ],
  [ApplicationStatus.MORE_INFORMATION]: [
    ApplicationStatus.APPROVED,
    ApplicationStatus.DECLINED,
  ],
  [ApplicationStatus.APPROVED]: [],
  [ApplicationStatus.DECLINED]: [],
};

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 1. Auth guard — enforced here independently of middleware
  try {
    await requireAdminSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const { id } = params;

  // 2. Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status value.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { status: newStatus } = parsed.data;

  // 3. Load current application
  const application = await db.partnerApplication.findUnique({
    where: { id },
    select: { id: true, status: true, email: true, name: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  // 4. Enforce state machine
  const allowedTransitions = VALID_TRANSITIONS[application.status] ?? [];
  if (!allowedTransitions.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Invalid transition: cannot move from ${application.status} to ${newStatus}.`,
        currentStatus: application.status,
        allowedTransitions,
      },
      { status: 422 }
    );
  }

  // 5. Handle APPROVED path — atomic transaction
  if (newStatus === ApplicationStatus.APPROVED) {
    return handleApproval(id, application.email, application.name);
  }

  // 6. Handle DECLINED / MORE_INFORMATION — simple status update
  const updated = await db.partnerApplication.update({
    where: { id },
    data: { status: newStatus },
    select: {
      applicationNumber: true,
      status: true,
      updatedAt: true,
    },
  });

  const dispatchEmail = await notifyUser({
    tx: db, // we are not in a transaction here, but notifyUser accepts PrismaClient
    userId: "SYSTEM_NO_USER", // We don't have a user ID for declined applicants
    type: NotificationType.APPLICATION_UPDATE,
    title: "Application Status Update",
    message: `Your application has been updated to ${newStatus}.`,
    email: {
      to: application.email,
      subject: "Cortex Partner Program - Application Status",
      html: `<p>Hi ${application.name},</p><p>Your application status has been updated to <strong>${newStatus.replace(/_/g, " ")}</strong>.</p>`,
    }
  }, true); // skip in-app notification since they aren't a user

  dispatchEmail();

  return NextResponse.json({
    success: true,
    applicationNumber: updated.applicationNumber,
    status: updated.status,
  });
}

/**
 * Handles the APPROVED transition atomically.
 * Creates User + Partner + AccountSetupToken in a single transaction.
 * If anything fails, nothing is created.
 */
async function handleApproval(
  applicationId: string,
  email: string,
  name: string
): Promise<NextResponse> {
  // Pre-check: does a User with this email already exist?
  // (Cannot do inside Prisma transaction with findUnique safely — check before)
  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        error: `A user account with email ${email} already exists. Cannot create duplicate.`,
      },
      { status: 409 }
    );
  }

  // Generate secure setup token BEFORE transaction
  // plaintext token: 32 random bytes → hex string (64 chars)
  const plainToken = crypto.randomBytes(32).toString("hex");
  // Store only the SHA-256 hash in the database
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Atomically generate CP-XXXXX partner ID
      const sequence = await tx.sequence.upsert({
        where: { id: "PARTNER" },
        update: { value: { increment: 1 } },
        create: { id: "PARTNER", value: 1 },
      });
      const partnerId = `CP-${String(sequence.value).padStart(5, "0")}`;

      // 2. Create User (no password — set during account setup in Phase 4)
      const user = await tx.user.create({
        data: {
          email,
          name,
          role: UserRole.PARTNER,
          // password intentionally null — set via account setup flow
        },
        select: { id: true },
      });

      // 3. Create Partner linked to User and Application
      const partner = await tx.partner.create({
        data: {
          partnerId,
          userId: user.id,
          partnerApplicationId: applicationId,
        },
        select: { partnerId: true },
      });

      // 4. Store hashed setup token (never plaintext)
      await tx.accountSetupToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt,
        },
      });

      // 5. Mark application as APPROVED
      const updatedApplication = await tx.partnerApplication.update({
        where: { id: applicationId },
        data: { status: ApplicationStatus.APPROVED },
        select: {
          applicationNumber: true,
          status: true,
        },
      });

      // 6. Notify user
      const setupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/setup-account?token=${plainToken}`;
      const dispatchEmail = await notifyUser({
        tx,
        userId: user.id,
        type: NotificationType.APPLICATION_UPDATE,
        title: "Application Approved",
        message: "Welcome to the Cortex Partner Program! Check your email to set up your account.",
        email: {
          to: email,
          subject: "Welcome to the Cortex Partner Program - Setup Your Account",
          html: `<p>Hi ${name},</p>
          <p>Congratulations! Your application to the Cortex Partner Program has been approved.</p>
          <p>Please click the link below to set up your account password and access the dashboard:</p>
          <a href="${setupUrl}">Set up my account</a>
          <p>This link expires in 72 hours.</p>`,
        }
      });

      return { partner, updatedApplication, userId: user.id, dispatchEmail };
    });

    // Execute the async email dispatch after transaction succeeds
    result.dispatchEmail();

    // Return safe summary — plaintext token returned ONCE for Phase 4 email dispatch
    // It will never be stored or retrievable again after this response
    return NextResponse.json({
      success: true,
      applicationNumber: result.updatedApplication.applicationNumber,
      status: result.updatedApplication.status,
      partnerId: result.partner.partnerId,
      // setupToken: plaintext token, returned once for email dispatch (Phase 4 will use this)
      setupToken: plainToken,
      setupTokenExpiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Approval transaction failed:", err);
    // Transaction was rolled back — nothing was created
    return NextResponse.json(
      { error: "Approval failed. No records were created. Please try again." },
      { status: 500 }
    );
  }
}
