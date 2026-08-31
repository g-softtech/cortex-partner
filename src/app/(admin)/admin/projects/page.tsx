import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProjectStatus, OpportunityStatus } from "@prisma/client";
import Link from "next/link";

export const metadata = {
  title: "Projects | Cortex Admin",
};

const STATUS_COLORS: Partial<Record<ProjectStatus, string>> = {
  SUBMITTED:             "bg-amber-100 text-amber-800",
  UNDER_REVIEW:          "bg-blue-100 text-blue-800",
  PRICED:                "bg-purple-100 text-purple-800",
  PROPOSAL_SENT:         "bg-indigo-100 text-indigo-800",
  WON:                   "bg-green-100 text-green-800",
  DEVELOPMENT:           "bg-sky-100 text-sky-800",
  DELIVERED:             "bg-green-100 text-green-800",
  LOST:                  "bg-red-100 text-red-800",
  CANCELLED:             "bg-gray-100 text-gray-600",
};

const OPPORTUNITY_COLORS: Record<OpportunityStatus, string> = {
  HIGH:    "bg-green-100 text-green-800",
  MEDIUM:  "bg-yellow-100 text-yellow-800",
  LOW:     "bg-slate-100 text-slate-600",
  UNKNOWN: "bg-gray-100 text-gray-500",
};

export default async function AdminProjectsPage() {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  const projects = await db.project.findMany({
    select: {
      id: true,
      projectNumber: true,
      projectType: true,
      projectStatus: true,
      opportunityStatus: true,
      partnerPrice: true,
      createdAt: true,
      partner: {
        select: {
          partnerId: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">
          All partner project submissions ({projects.length} total)
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-16 text-center">
          <p className="text-sm text-slate-500">No projects submitted yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Partner
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Opportunity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="block font-mono text-xs text-slate-400"
                    >
                      {project.projectNumber}
                    </Link>
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="block text-sm font-medium text-slate-900 hover:text-blue-600"
                    >
                      {project.projectType.replace(/_/g, " ")}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-slate-500">{project.partner.partnerId}</p>
                    <p className="text-sm text-slate-700">{project.partner.user.name ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[project.projectStatus] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {project.projectStatus.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        OPPORTUNITY_COLORS[project.opportunityStatus]
                      }`}
                    >
                      {project.opportunityStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-700">
                    {project.partnerPrice !== null
                      ? `£${project.partnerPrice.toFixed(2)}`
                      : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(project.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
