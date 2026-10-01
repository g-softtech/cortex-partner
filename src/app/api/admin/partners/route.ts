import { NextResponse } from "next/server";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdminSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  try {
    const partners = await db.partner.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        partnerId: true,
        status: true,
        joinedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    return NextResponse.json({ partners });
  } catch (err) {
    console.error("Failed to fetch partners:", err);
    return NextResponse.json({ error: "Failed to fetch partners." }, { status: 500 });
  }
}
