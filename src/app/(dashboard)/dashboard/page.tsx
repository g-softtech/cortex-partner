import { notFound } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";
import Link from "next/link";
import { CURRENT_AGREEMENT_VERSION } from "@/lib/agreements/partner-agreement";

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

const ACTIVE_STATUSES: ProjectStatus[] = [
  "SUBMITTED", "UNDER_REVIEW", "PRICED", "PROPOSAL_SENT", "WON",
  "KICKOFF_SUBMITTED", "READY_FOR_DEVELOPMENT", "DEVELOPMENT",
  "INTERNAL_QA", "PARTNER_REVIEW", "CUSTOMER_REVIEW", "CHANGES",
  "FINAL_APPROVAL", "SUPPORT",
];

export const metadata = {
  title: "Dashboard | Cortex Partner Program",
  description: "Your partner dashboard overview",
};

export default async function DashboardPage() {
  // requirePartnerSession enforces PARTNER role AND verifies Partner record exists
  const { session, partner } = await requirePartnerSession().catch(() => notFound());

  // Fetch project counts — never select adminNotes or opportunityStatus
  const projects = await db.project.findMany({
    where: { partnerId: partner.id },
    select: {
      id: true,
      projectNumber: true,
      projectType: true,
      projectStatus: true,
      description: true,
      createdAt: true,
      kickoff: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const totalProjects = await db.project.count({ where: { partnerId: partner.id } });
  const activeProjects = await db.project.count({
    where: { partnerId: partner.id, projectStatus: { in: ACTIVE_STATUSES } },
  });
  const deliveredProjects = await db.project.count({
    where: { partnerId: partner.id, projectStatus: "DELIVERED" },
  });

  // Agreement check
  const hasAgreement = await db.partnerAgreementLog.findFirst({
    where: { partnerId: partner.id, version: CURRENT_AGREEMENT_VERSION },
    select: { id: true },
  });

  // Contextual action: find the most actionable project
  const kickoffNeeded = projects.find(
    (p) => p.projectStatus === "WON" && !p.kickoff
  );
  const reviewNeeded = projects.find(
    (p) => p.projectStatus === "PARTNER_REVIEW" || p.projectStatus === "FINAL_APPROVAL"
  );
  const kickoffDraft = projects.find(
    (p) => p.kickoff && (p.kickoff.status === "DRAFT" || p.kickoff.status === "INFORMATION_REQUIRED")
  );

  return (
    <div className="space-y-8">
      {/* Agreement Banner */}
      {!hasAgreement && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">Partner Agreement Required</p>
              <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                Please read and accept the Cortex Partner Agreement to activate your full account.
              </p>
            </div>
          </div>
          <Link
            href="/onboarding/agreement"
            className="shrink-0 rounded-md bg-amber-600 dark:bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 dark:hover:bg-amber-400 transition-colors"
          >
            Review &amp; Accept Agreement
          </Link>
        </div>
      )}

      {/* Contextual Next Action Banner */}
      {hasAgreement && (kickoffNeeded || kickoffDraft || reviewNeeded) && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-200 text-sm">Next Action Required</p>
            {kickoffDraft && (
              <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
                Complete Project Kickoff for <span className="font-mono font-bold">{kickoffDraft.projectNumber}</span>
              </p>
            )}
            {!kickoffDraft && kickoffNeeded && (
              <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
                Project <span className="font-mono font-bold">{kickoffNeeded.projectNumber}</span> has been won — start the kickoff.
              </p>
            )}
            {!kickoffDraft && !kickoffNeeded && reviewNeeded && (
              <p className="mt-0.5 text-xs text-blue-700 dark:text-blue-400">
                Project <span className="font-mono font-bold">{reviewNeeded.projectNumber}</span> is awaiting your review.
              </p>
            )}
          </div>
          <Link
            href={`/projects/${
              (kickoffDraft || kickoffNeeded || reviewNeeded)!.id
            }${kickoffDraft || kickoffNeeded ? "/kickoff" : ""}`}
            className="shrink-0 rounded-md bg-blue-700 dark:bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors"
          >
            {kickoffDraft ? "Continue Kickoff" : kickoffNeeded ? "Start Kickoff" : "Review Project"}
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Welcome back, {session.user.name ?? "Partner"}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Partner ID:{" "}
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{partner.partnerId}</span>
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          Submit New Project
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Total Projects
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">{totalProjects}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Active
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{activeProjects}</p>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-5">
          <p className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Delivered
          </p>
          <p className="mt-2 text-3xl font-bold text-green-600">{deliveredProjects}</p>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="rounded-lg border bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Recent Projects</h2>
          {totalProjects > 0 && (
            <Link href="/projects" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100">
              View all →
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">You haven&apos;t submitted any projects yet.</p>
            <div className="mt-4">
              <Link
                href="/projects/new"
                className="inline-flex items-center rounded-md bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:bg-slate-900/50"
              >
                Submit your first project
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:bg-slate-900/50"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-slate-400">{project.projectNumber}</p>
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {project.description.slice(0, 80)}
                      {project.description.length > 80 ? "…" : ""}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{project.projectType.replace(/_/g, " ")}</p>
                  </div>
                  <span
                    className={`ml-4 shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[project.projectStatus] ?? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
                  >
                    {STATUS_LABELS[project.projectStatus] ?? project.projectStatus}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
