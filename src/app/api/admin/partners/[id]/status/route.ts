import { NextResponse } from "next/server";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";
import { updatePartnerStatusSchema } from "@/lib/validations/partner";
import { db } from "@/lib/db";
import { PartnerStatus, NotificationType } from "@prisma/client";
import { notifyUser } from "@/lib/notifications";

export async function PATCH(
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = updatePartnerStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid status parameters.", issues: parsed.error.errors },
      { status: 400 }
    );
  }

  const { action, reason } = parsed.data;

  // Load target partner and user details
  const partner = await db.partner.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  if (!partner) {
    return NextResponse.json({ error: "Partner account not found." }, { status: 404 });
  }

  // Determine target status & validate state machine transitions
  let targetStatus: PartnerStatus;
  const currentStatus = partner.status;

  if (action === "SUSPEND") {
    if (currentStatus !== PartnerStatus.ACTIVE) {
      return NextResponse.json(
        { error: `Cannot suspend partner with status ${currentStatus}. Only ACTIVE partners can be suspended.` },
        { status: 422 }
      );
    }
    targetStatus = PartnerStatus.SUSPENDED;
  } else if (action === "REACTIVATE") {
    if (currentStatus !== PartnerStatus.SUSPENDED) {
      return NextResponse.json(
        { error: `Cannot reactivate partner with status ${currentStatus}. Only SUSPENDED partners can be reactivated.` },
        { status: 422 }
      );
    }
    targetStatus = PartnerStatus.ACTIVE;
  } else if (action === "REVOKE") {
    if (currentStatus === PartnerStatus.INACTIVE) {
      return NextResponse.json(
        { error: "Partner account is already revoked/inactive." },
        { status: 422 }
      );
    }
    targetStatus = PartnerStatus.INACTIVE;
  } else {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Update Partner Status
      const updatedPartner = await tx.partner.update({
        where: { id: partner.id },
        data: { status: targetStatus },
        select: {
          id: true,
          partnerId: true,
          status: true,
          updatedAt: true,
        },
      });

      // 2. Invalidate Sessions and Setup Tokens if entering non-ACTIVE state
      if (targetStatus !== PartnerStatus.ACTIVE) {
        await tx.session.deleteMany({
          where: { userId: partner.userId },
        });
        await tx.accountSetupToken.deleteMany({
          where: { userId: partner.userId },
        });
      }

      // 3. Create AuditLog Record
      await tx.auditLog.create({
        data: {
          action: `PARTNER_${action}`,
          entityType: "Partner",
          entityId: partner.id,
          userId: adminSession.user.id,
          metadata: {
            partnerId: partner.partnerId,
            partnerEmail: partner.user.email,
            previousStatus: currentStatus,
            newStatus: targetStatus,
            reason: reason || null,
            timestamp: new Date().toISOString(),
          },
        },
      });

      // 4. Prepare email notification
      const emailSubject =
        action === "SUSPEND"
          ? "Cortex Partner Account Status - Suspended"
          : action === "REACTIVATE"
          ? "Cortex Partner Account Status - Reactivated"
          : "Cortex Partner Account Status - Revoked";

      const emailBodyText =
        action === "SUSPEND"
          ? `Your Cortex Partner account (${partner.partnerId}) has been temporarily suspended.`
          : action === "REACTIVATE"
          ? `Your Cortex Partner account (${partner.partnerId}) has been reactivated. You may now log in.`
          : `Your Cortex Partner account (${partner.partnerId}) access has been revoked.`;

      const dispatchEmail = await notifyUser({
        tx,
        userId: partner.userId,
        type: NotificationType.APPLICATION_UPDATE,
        title: "Partner Account Status Updated",
        message: emailBodyText,
        email: {
          to: partner.user.email,
          subject: emailSubject,
          html: `<p>Hi ${partner.user.name},</p><p>${emailBodyText}</p>${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}`,
        },
      });

      return { updatedPartner, dispatchEmail };
    });

    // Execute notification dispatch outside the core DB transaction (non-blocking)
    try {
      await result.dispatchEmail();
    } catch (notifyErr) {
      console.error("Partner status notification email failed to dispatch:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      partnerId: result.updatedPartner.partnerId,
      previousStatus: currentStatus,
      newStatus: result.updatedPartner.status,
      updatedAt: result.updatedPartner.updatedAt,
    });
  } catch (err) {
    console.error("Partner status transition failed:", err);
    return NextResponse.json({ error: "Failed to update partner status." }, { status: 500 });
  }
}
