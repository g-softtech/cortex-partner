import { notFound } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProjectStatus, ProjectType } from "@prisma/client";
import Link from "next/link";

export const metadata = {
  title: "Project Details | Cortex Partner Program",
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

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Enforce PARTNER role — throws if ADMIN or unauthenticated
  const { partner } = await requirePartnerSession().catch(() => notFound());

  // STRICTLY select partner-visible fields.
  // adminNotes and opportunityStatus are NEVER selected — they do not exist in the result.
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
      // Fetch partnerId for ownership check only
      partnerId: true,
    },
  });

  // Not found or IDOR check: the project must belong to this partner.
  // Return 404 (not 403) to avoid confirming the existence of other partners' projects.
  if (!project || project.partnerId !== partner.id) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/projects" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Projects
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-xs text-slate-400">{project.projectNumber}</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">
              {TYPE_LABELS[project.projectType]}
            </h1>
          </div>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[project.projectStatus] ?? "bg-slate-100 text-slate-700"}`}
          >
            {STATUS_LABELS[project.projectStatus] ?? project.projectStatus}
          </span>
        </div>
      </div>

      {/* Project Details */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Project Details</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Project Type
            </dt>
            <dd className="mt-1 text-slate-900">{TYPE_LABELS[project.projectType]}</dd>
          </div>
          {project.budget && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
                Budget
              </dt>
              <dd className="mt-1 text-slate-900">{project.budget}</dd>
            </div>
          )}
          {project.timeline && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
                Desired Timeline
              </dt>
              <dd className="mt-1 text-slate-900">{project.timeline}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Submitted
            </dt>
            <dd className="mt-1 text-slate-900">
              {new Date(project.createdAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Description
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900">{project.description}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Requested Features
            </dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900">{project.features}</dd>
          </div>
        </dl>
      </div>

      {/* Cortex Assessment (only shown if available) */}
      {(project.partnerPrice || project.estimatedTimeline || project.scope) && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Cortex Assessment</h2>
          <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
            {project.partnerPrice !== null && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Partner Price
                </dt>
                <dd className="mt-1 font-semibold text-slate-900">
                  £{project.partnerPrice.toFixed(2)}
                </dd>
              </div>
            )}
            {project.estimatedTimeline && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Estimated Timeline
                </dt>
                <dd className="mt-1 text-slate-900">{project.estimatedTimeline}</dd>
              </div>
            )}
            {project.scope && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
                  Scope
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-900">{project.scope}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
