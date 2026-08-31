import { notFound } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";
import Link from "next/link";

export const metadata = {
  title: "Projects | Cortex Partner Program",
  description: "Your project portfolio",
};

const STATUS_LABELS: Partial<Record<ProjectStatus, string>> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  PRICED: "Priced",
  PROPOSAL_SENT: "Proposal Sent",
  WON: "Won",
  KICKOFF_SUBMITTED: "Kickoff Submitted",
  READY_FOR_DEVELOPMENT: "Ready for Development",
  DEVELOPMENT: "In Development",
  INTERNAL_QA: "Internal QA",
  PARTNER_REVIEW: "Partner Review",
  CUSTOMER_REVIEW: "Customer Review",
  CHANGES: "Changes",
  FINAL_APPROVAL: "Final Approval",
  DELIVERED: "Delivered",
  SUPPORT: "Support",
  LOST: "Lost",
  CANCELLED: "Cancelled",
  ARCHIVED: "Archived",
};

const STATUS_COLORS: Partial<Record<ProjectStatus, string>> = {
  SUBMITTED: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  PRICED: "bg-purple-100 text-purple-800",
  PROPOSAL_SENT: "bg-indigo-100 text-indigo-800",
  WON: "bg-green-100 text-green-800",
  KICKOFF_SUBMITTED: "bg-teal-100 text-teal-800",
  READY_FOR_DEVELOPMENT: "bg-cyan-100 text-cyan-800",
  DEVELOPMENT: "bg-sky-100 text-sky-800",
  INTERNAL_QA: "bg-orange-100 text-orange-800",
  PARTNER_REVIEW: "bg-yellow-100 text-yellow-800",
  CUSTOMER_REVIEW: "bg-pink-100 text-pink-800",
  CHANGES: "bg-rose-100 text-rose-800",
  FINAL_APPROVAL: "bg-lime-100 text-lime-800",
  DELIVERED: "bg-green-100 text-green-800",
  SUPPORT: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200",
  LOST: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

export default async function ProjectsPage() {
  const { partner } = await requirePartnerSession().catch(() => notFound());

  // Strictly select partner-visible fields only — no adminNotes, no opportunityStatus
  const projects = await db.project.findMany({
    where: { partnerId: partner.id },
    select: {
      id: true,
      projectNumber: true,
      projectType: true,
      description: true,
      budget: true,
      timeline: true,
      projectStatus: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">All project submissions for your partner account.</p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Submit New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-slate-50 dark:bg-slate-900/50 px-6 py-16 text-center">
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">No projects yet</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Submit your first project to get an estimate.
          </p>
          <div className="mt-6">
            <Link
              href="/projects/new"
              className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"
            >
              Submit Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-white dark:bg-slate-800">
          <ul className="divide-y">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex flex-col gap-1 px-6 py-4 hover:bg-slate-50 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">{project.projectNumber}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{project.projectType.replace(/_/g, " ")}</span>
                    </div>
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {project.description.slice(0, 100)}
                      {project.description.length > 100 ? "…" : ""}
                    </p>
                    <p className="text-xs text-slate-400">
                      Submitted {new Date(project.createdAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <span
                    className={`mt-2 shrink-0 inline-flex items-center self-start rounded-full px-2.5 py-0.5 text-xs font-medium sm:mt-0 sm:ml-4 ${STATUS_COLORS[project.projectStatus] ?? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                  >
                    {STATUS_LABELS[project.projectStatus] ?? project.projectStatus}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
