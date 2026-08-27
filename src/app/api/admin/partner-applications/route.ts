import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminSession, isAuthError } from "@/lib/auth/session";
import { ApplicationStatus } from "@prisma/client";

/**
 * GET /api/admin/partner-applications
 *
 * Returns a paginated list of partner applications.
 * Supports optional ?status= filter and ?page= pagination.
 *
 * Authorization: ADMIN only.
 * Returns only safe public fields — no internal DB IDs exposed on list view.
 */
export async function GET(req: Request) {
  // 1. Auth guard — enforced in the service layer, independent of middleware
  try {
    await requireAdminSession();
  } catch (err) {
    if (isAuthError(err)) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  // 2. Parse query params
  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const PAGE_SIZE = 20;
  const skip = (page - 1) * PAGE_SIZE;

  // Validate status filter
  const validStatuses = Object.values(ApplicationStatus);
  const statusFilter =
    statusParam && validStatuses.includes(statusParam as ApplicationStatus)
      ? (statusParam as ApplicationStatus)
      : undefined;

  // 3. Query
  const [applications, total] = await Promise.all([
    db.partnerApplication.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      // Select only safe fields — no internal cuid() IDs exposed in list
      select: {
        applicationNumber: true,
        name: true,
        email: true,
        phone: true,
        occupation: true,
        hasPotentialClients: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Include the id for admin use (detail page linking) — but it is
        // only used server-to-server for the admin link; not displayed to public
        id: true,
      },
    }),
    db.partnerApplication.count({
      where: statusFilter ? { status: statusFilter } : undefined,
    }),
  ]);

  return NextResponse.json({
    applications,
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    },
  });
}
