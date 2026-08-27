import { db } from "@/lib/db";
import { ApplicationStatus } from "@prisma/client";
import Link from "next/link";

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
  MORE_INFORMATION: "More Info Required",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-200",
  APPROVED: "bg-green-100 text-green-800 border-green-200",
  DECLINED: "bg-red-100 text-red-800 border-red-200",
  MORE_INFORMATION: "bg-blue-100 text-blue-800 border-blue-200",
};

interface PageProps {
  searchParams: { status?: string; page?: string };
}

export default async function PartnerApplicationsPage({ searchParams }: PageProps) {
  const statusParam = searchParams?.status;
  const pageParam = parseInt(searchParams?.page ?? "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const PAGE_SIZE = 20;
  const skip = (page - 1) * PAGE_SIZE;

  const validStatuses = Object.values(ApplicationStatus);
  const statusFilter =
    statusParam && validStatuses.includes(statusParam as ApplicationStatus)
      ? (statusParam as ApplicationStatus)
      : undefined;

  const [applications, total] = await Promise.all([
    db.partnerApplication.findMany({
      where: statusFilter ? { status: statusFilter } : undefined,
      orderBy: { createdAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        applicationNumber: true,
        name: true,
        email: true,
        occupation: true,
        status: true,
        createdAt: true,
      },
    }),
    db.partnerApplication.count({
      where: statusFilter ? { status: statusFilter } : undefined,
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Partner Applications</h1>
          <p className="text-sm text-slate-500 mt-1">{total} total application{total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[undefined, ...validStatuses].map((s) => {
          const label = s ? STATUS_LABELS[s] : "All";
          const isActive = statusFilter === s;
          return (
            <Link
              key={s ?? "all"}
              href={`/admin/partner-applications${s ? `?status=${s}` : ""}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No applications found{statusFilter ? ` with status "${STATUS_LABELS[statusFilter]}"` : ""}.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Application #</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Occupation</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Submitted</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{app.applicationNumber}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{app.name}</td>
                  <td className="px-4 py-3 text-slate-600">{app.email}</td>
                  <td className="px-4 py-3 text-slate-600">{app.occupation}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status]}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(app.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/partner-applications/${app.id}`}
                      className="text-slate-700 hover:text-slate-900 underline underline-offset-2 text-xs font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/partner-applications?${statusFilter ? `status=${statusFilter}&` : ""}page=${page - 1}`}
                className="px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/partner-applications?${statusFilter ? `status=${statusFilter}&` : ""}page=${page + 1}`}
                className="px-3 py-1.5 text-sm border rounded-md bg-white hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
