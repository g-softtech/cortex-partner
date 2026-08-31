import { NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { CURRENT_AGREEMENT_VERSION } from "@/lib/agreements/partner-agreement";
import { z } from "zod";

const acceptSchema = z.object({
  version: z.string().min(1),
});

/**
 * POST /api/partners/accept-agreement
 *
 * Records the authenticated partner's acceptance of a versioned agreement.
 * - Idempotent: if the partner has already accepted this exact version, returns 200.
 * - Historical: prior version acceptances are never overwritten.
 * - The version is validated against CURRENT_AGREEMENT_VERSION to prevent
 *   a client from claiming acceptance of a version that doesn't exist yet.
 */
export async function POST(req: Request) {
  try {
    const { partner, session } = await requirePartnerSession();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Version is required." }, { status: 400 });
    }

    const { version } = parsed.data;

    // Only accept the currently active version
    if (version !== CURRENT_AGREEMENT_VERSION) {
      return NextResponse.json(
        { error: `Invalid agreement version. Current version is ${CURRENT_AGREEMENT_VERSION}.` },
        { status: 400 }
      );
    }

    // Idempotent: check if already accepted this version
    const existing = await db.partnerAgreementLog.findFirst({
      where: { partnerId: partner.id, version },
      select: { id: true, acceptedAt: true },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyAccepted: true,
        acceptedAt: existing.acceptedAt,
        version,
      });
    }

    // Record the acceptance
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const record = await db.partnerAgreementLog.create({
      data: {
        partnerId: partner.id,
        version,
        ipAddress,
      },
      select: { id: true, acceptedAt: true, version: true },
    });

    // Audit log the acceptance
    await db.auditLog.create({
      data: {
        action: "PARTNER_AGREEMENT_ACCEPTED",
        entityType: "PartnerAgreementLog",
        entityId: record.id,
        metadata: { version, partnerId: partner.id },
        userId: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      alreadyAccepted: false,
      acceptedAt: record.acceptedAt,
      version: record.version,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error recording agreement acceptance:", error);
    return NextResponse.json({ error: "Failed to record agreement." }, { status: 500 });
  }
}

/**
 * GET /api/partners/accept-agreement
 *
 * Returns whether the authenticated partner has accepted the current agreement version.
 */
export async function GET() {
  try {
    const { partner } = await requirePartnerSession();

    const record = await db.partnerAgreementLog.findFirst({
      where: { partnerId: partner.id, version: CURRENT_AGREEMENT_VERSION },
      select: { acceptedAt: true, version: true },
    });

    return NextResponse.json({
      hasAccepted: !!record,
      version: CURRENT_AGREEMENT_VERSION,
      acceptedAt: record?.acceptedAt ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to check agreement." }, { status: 500 });
  }
}
