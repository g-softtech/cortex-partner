import { notFound } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProjectStatus, ProjectType } from "@prisma/client";
import Link from "next/link";
import { AcceptProposalButton } from "./AcceptProposalButton";
import ReviewPanel from "./ReviewPanel";

export const metadata = {
  title: "Project Details | Cortex Partner Program",
};

export const dynamic = "force-dynamic";

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
  CHANGES: "Changes Requested",
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
  DELIVERED: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const TYPE_LABELS: Record<ProjectType, string> = {
  WEBSITE: "Website",
  ECOMMERCE: "E-Commerce",
  WEB_APP: "Web Application",
  CUSTOM_SOFTWARE: "Custom Software",
  MOBILE_APP: "Mobile App",
  SAAS: "SaaS",
  BUSINESS_MANAGEMENT: "Business Management",
  AUTOMATION: "Automation",
  OTHER: "Other",
};

// Statuses where the partner is allowed to see pricing/scope/timeline
const PROPOSAL_VISIBLE_STATUSES: ProjectStatus[] = [
  ProjectStatus.PROPOSAL_SENT,
  ProjectStatus.WON,
  ProjectStatus.KICKOFF_SUBMITTED,
  ProjectStatus.READY_FOR_DEVELOPMENT,
  ProjectStatus.DEVELOPMENT,
  ProjectStatus.INTERNAL_QA,
  ProjectStatus.PARTNER_REVIEW,
  ProjectStatus.CUSTOMER_REVIEW,
  ProjectStatus.CHANGES,
  ProjectStatus.FINAL_APPROVAL,
  ProjectStatus.DELIVERED,
  ProjectStatus.SUPPORT,
  ProjectStatus.ARCHIVED,
];

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Enforce PARTNER role — throws if ADMIN or unauthenticated
  const { partner } = await requirePartnerSession().catch(() => notFound());

  // Fetch project — explicit select, never include adminNotes or opportunityStatus
  const project = await db.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      projectNumber: true,
      projectType: true,
      description: true,
      features: true,
      budget: true,
      timeline: true,
      projectStatus: true,
      partnerPrice: true,
      estimatedTimeline: true,
      scope: true,
      createdAt: true,
      updatedAt: true,
      partnerId: true,
      kickoff: { select: { id: true, status: true } },
    },
  });

  // IDOR: return 404 (not 403) to avoid confirming existence of other partners' projects
  if (!project || project.partnerId !== partner.id) {
    notFound();
  }

  // Only reveal proposal details once status is PROPOSAL_SENT or later
  const showProposal = PROPOSAL_VISIBLE_STATUSES.includes(project.projectStatus);
  const canAcceptProposal = project.projectStatus === ProjectStatus.PROPOSAL_SENT;
  const hasKickoff = !!project.kickoff;
  const canEditKickoff =
    hasKickoff &&
    (project.kickoff!.status === "DRAFT" || project.kickoff!.status === "INFORMATION_REQUIRED");

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/projects" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300">
          ← Back to Projects
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs text-slate-400">{project.projectNumber}</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
              {TYPE_LABELS[project.projectType]}
            </h1>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[project.projectStatus] ?? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}
          >
            {STATUS_LABELS[project.projectStatus] ?? project.projectStatus}
          </span>
        </div>
      </div>

      {/* Accept Proposal Banner — only shown when PROPOSAL_SENT */}
      {canAcceptProposal && (
        <AcceptProposalButton
          projectId={project.id}
          projectNumber={project.projectNumber}
        />
      )}

      {/* Review Panel — only shown when in PARTNER_REVIEW or CUSTOMER_REVIEW */}
      <ReviewPanel
        projectId={project.id}
        currentStatus={project.projectStatus}
      />

      {/* Change Requests Link — only shown when DELIVERED or SUPPORT */}
      {(project.projectStatus === ProjectStatus.DELIVERED || project.projectStatus === ProjectStatus.SUPPORT) && (
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Change Requests</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Submit and manage post-delivery change requests for this project.
              </p>
            </div>
            <Link
              href={`/projects/${project.id}/changes`}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              View Change Requests
            </Link>
          </div>
        </div>
      )}

      {/* Kickoff Actions — shown after acceptance */}
      {hasKickoff && (
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Project Kickoff</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Status:{" "}
                <span className="font-medium capitalize text-slate-700 dark:text-slate-300">
                  {project.kickoff!.status.replace(/_/g, " ")}
                </span>
              </p>
            </div>
            {canEditKickoff && (
              <Link
                href={`/projects/${project.id}/kickoff`}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                {project.kickoff!.status === "DRAFT" ? "Complete Kickoff" : "Update Kickoff"}
              </Link>
            )}
            {project.kickoff!.status === "SUBMITTED" && (
              <span className="text-sm text-slate-500 dark:text-slate-400 italic">Awaiting Cortex review…</span>
            )}
            {project.kickoff!.status === "APPROVED" && (
              <span className="text-sm font-medium text-green-700">✓ Kickoff Approved</span>
            )}
          </div>
        </div>
      )}

      {/* Project Details */}
      <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-slate-100">Project Details</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Project Type</dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-100">{TYPE_LABELS[project.projectType]}</dd>
          </div>
          {project.budget && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Budget</dt>
              <dd className="mt-1 text-slate-900 dark:text-slate-100">{project.budget}</dd>
            </div>
          )}
          {project.timeline && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Desired Timeline</dt>
              <dd className="mt-1 text-slate-900 dark:text-slate-100">{project.timeline}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Submitted</dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-100">
              {new Date(project.createdAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900 dark:text-slate-100">{project.description}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">Requested Features</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900 dark:text-slate-100">{project.features}</dd>
          </div>
        </dl>
      </div>

      {/* Cortex Proposal — ONLY shown when status is PROPOSAL_SENT or later */}
      {showProposal && (project.partnerPrice || project.estimatedTimeline || project.scope) && (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-6">
          <h2 className="mb-4 text-base font-semibold text-indigo-900">Cortex Proposal</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {project.partnerPrice !== null && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-widest text-indigo-600">Partner Price</dt>
                <dd className="mt-1 text-lg font-bold text-indigo-900">
                  £{project.partnerPrice.toFixed(2)}
                </dd>
              </div>
            )}
            {project.estimatedTimeline && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-widest text-indigo-600">Estimated Timeline</dt>
                <dd className="mt-1 font-semibold text-indigo-900">{project.estimatedTimeline}</dd>
              </div>
            )}
            {project.scope && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-widest text-indigo-600">Scope</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-900 dark:text-slate-100">{project.scope}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
