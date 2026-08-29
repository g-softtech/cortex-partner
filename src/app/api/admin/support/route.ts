import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/session";

export async function GET() {
  try {
    await requireAdminSession();

    const supportRequests = await db.supportRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        partner: {
          select: {
            id: true,
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(supportRequests);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Session")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching support requests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
