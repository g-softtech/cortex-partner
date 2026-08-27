import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";

/**
 * GET /api/admin/partner-applications/[id]
 *
 * Returns the full detail of a single partner application.
 * Admin use only. Returns all application fields.
 *
 * Authorization: ADMIN only.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // 1. Auth guard
  try {
    await requireAdminSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const { id } = params;

  // 2. Fetch application
  const application = await db.partnerApplication.findUnique({
    where: { id },
    select: {
      id: true,
      applicationNumber: true,
      name: true,
      email: true,
      phone: true,
      occupation: true,
      hasPotentialClients: true,
      potentialClientType: true,
      reason: true,
      source: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      // If approved: include linked partner summary
      partner: {
        select: {
          partnerId: true,
          status: true,
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json(
      { error: "Application not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ application });
}
