import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";
import { adminSupportUpdateSchema } from "@/lib/validations/support";
import { notifyUser } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminSession();
    const { id } = params;

    const body = await req.json();
    const result = adminSupportUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid data", issues: result.error.errors },
        { status: 400 }
      );
    }

    const { status } = result.data;

    const currentTicket = await db.supportRequest.findUnique({
      where: { id },
      include: {
        partner: {
          select: {
            userId: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (!currentTicket) {
      return NextResponse.json({ error: "Support request not found" }, { status: 404 });
    }

    const txResult = await db.$transaction(async (tx) => {
      const updated = await tx.supportRequest.update({
        where: { id },
        data: { status },
      });

      // Notify the partner of the status change
      const dispatchEmail = await notifyUser({
        tx,
        userId: currentTicket.partner.userId,
        type: NotificationType.SUPPORT_UPDATE,
        title: "Support Request Updated",
        message: `Your support request ${currentTicket.supportNumber} is now ${status}`,
        email: {
          to: currentTicket.partner.user.email,
          subject: `Support Request Updated: ${currentTicket.supportNumber}`,
          html: `<p>Hi ${currentTicket.partner.user.name},</p>
          <p>The status of your support request <strong>${currentTicket.supportNumber}</strong> has been updated to <strong>${status}</strong>.</p>
          <p>Please log in to your dashboard to view the latest details.</p>`,
        }
      });

      return { updated, dispatchEmail };
    });

    txResult.dispatchEmail();

    return NextResponse.json({
      success: true,
      supportRequest: txResult.updated,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error updating support request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
