import { notFound, redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProjectStatus, OpportunityStatus } from "@prisma/client";
import Link from "next/link";
import { AssessmentForm } from "./AssessmentForm";
import { KickoffReviewPanel } from "./KickoffReviewPanel";
import WorkflowPanel from "./WorkflowPanel";

export const metadata = {
  title: "Project Detail | Cortex Admin",
};

// Mirrors the server-side state machine — used to populate the dropdown
const VALID_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.SUBMITTED]:             [ProjectStatus.UNDER_REVIEW, ProjectStatus.LOST, ProjectStatus.CANCELLED],
  [ProjectStatus.UNDER_REVIEW]:          [ProjectStatus.PRICED, ProjectStatus.SUBMITTED, ProjectStatus.LOST, ProjectStatus.CANCELLED],
  [ProjectStatus.PRICED]:                [ProjectStatus.PROPOSAL_SENT, ProjectStatus.UNDER_REVIEW, ProjectStatus.LOST, ProjectStatus.CANCELLED],
  [ProjectStatus.PROPOSAL_SENT]:         [ProjectStatus.WON, ProjectStatus.LOST, ProjectStatus.CANCELLED],
  [ProjectStatus.WON]:                   [ProjectStatus.KICKOFF_SUBMITTED],
  [ProjectStatus.KICKOFF_SUBMITTED]:     [ProjectStatus.READY_FOR_DEVELOPMENT],
  [ProjectStatus.READY_FOR_DEVELOPMENT]: [ProjectStatus.DEVELOPMENT],
  [ProjectStatus.DEVELOPMENT]:           [ProjectStatus.INTERNAL_QA],
  [ProjectStatus.INTERNAL_QA]:           [ProjectStatus.PARTNER_REVIEW],
  [ProjectStatus.PARTNER_REVIEW]:        [ProjectStatus.CUSTOMER_REVIEW, ProjectStatus.CHANGES],
  [ProjectStatus.CUSTOMER_REVIEW]:       [ProjectStatus.FINAL_APPROVAL, ProjectStatus.CHANGES],
  [ProjectStatus.CHANGES]:               [ProjectStatus.PARTNER_REVIEW, ProjectStatus.CUSTOMER_REVIEW],
  [ProjectStatus.FINAL_APPROVAL]:        [ProjectStatus.DELIVERED],
  [ProjectStatus.DELIVERED]:             [ProjectStatus.SUPPORT, ProjectStatus.ARCHIVED],
  [ProjectStatus.SUPPORT]:               [ProjectStatus.ARCHIVED],
  [ProjectStatus.LOST]:                  [],
  [ProjectStatus.CANCELLED]:             [],
  [ProjectStatus.ARCHIVED]:              [],
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

export default async function AdminProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  // Admin sees ALL project fields — including adminNotes, opportunityStatus, partnerPrice, scope
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
      opportunityStatus: true,
      partnerPrice: true,
      estimatedTimeline: true,
      scope: true,
      adminNotes: true,
      createdAt: true,
      updatedAt: true,
      partner: {
        select: {
          id: true,
          partnerId: true,
          joinedAt: true,
          user: { select: { name: true, email: true } },
        },
      },
      kickoff: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,
          reviewedBy: true,
          approvedAt: true,
          businessName: true,
          businessDescription: true,
          primaryColor: true,
          secondaryColor: true,
          brandGuidelines: true,
          contentAbout: true,
          contentServices: true,
          contentProducts: true,
          contactInfo: true,
          socialLinks: true,
          requiredPages: true,
          agreedFeatures: true,
          integrations: true,
          domain: true,
          hostingStatus: true,
          designReferences: true,
        },
      },
      files: {
        select: {
          id: true,
          originalName: true,
          fileType: true,
          fileSize: true,
          category: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  const allowedTransitions = VALID_TRANSITIONS[project.projectStatus] ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href="/admin/projects" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Projects
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-xs text-slate-400">{project.projectNumber}</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">
            {project.projectType.replace(/_/g, " ")}
          </h1>
          <p className="text-sm text-slate-500">
            Submitted{" "}
            {new Date(project.createdAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              STATUS_COLORS[project.projectStatus] ?? "bg-slate-100 text-slate-700"
            }`}
          >
            {project.projectStatus.replace(/_/g, " ")}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              OPPORTUNITY_COLORS[project.opportunityStatus]
            }`}
          >
            {project.opportunityStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Partner Info */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Partner</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Partner ID</dt>
              <dd className="mt-1 font-mono font-semibold text-slate-900">{project.partner.partnerId}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Name</dt>
              <dd className="mt-1 text-slate-900">{project.partner.user.name ?? "—"}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Email</dt>
              <dd className="mt-1 text-slate-900">{project.partner.user.email}</dd>
            </div>
          </dl>
        </div>

        {/* Financial Assessment */}
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Assessment</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Partner Price</dt>
              <dd className="mt-1 font-mono font-bold text-slate-900">
                {project.partnerPrice !== null
                  ? `£${project.partnerPrice.toFixed(2)}`
                  : <span className="font-normal text-slate-400">Not set</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Est. Timeline</dt>
              <dd className="mt-1 text-slate-900">{project.estimatedTimeline ?? <span className="text-slate-400">Not set</span>}</dd>
            </div>
            {project.scope && (
              <div className="col-span-2">
                <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Scope</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-900">{project.scope}</dd>
              </div>
            )}
            {project.adminNotes && (
              <div className="col-span-2">
                <dt className="text-xs font-medium uppercase tracking-widest text-red-500">
                  Admin Notes (Internal)
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-700">{project.adminNotes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Partner Submission Details */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Project Submission</h2>
        <dl className="grid grid-cols-1 gap-5 text-sm sm:grid-cols-2">
          {project.budget && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Budget</dt>
              <dd className="mt-1 text-slate-900">{project.budget}</dd>
            </div>
          )}
          {project.timeline && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Desired Timeline</dt>
              <dd className="mt-1 text-slate-900">{project.timeline}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900">{project.description}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">Features</dt>
            <dd className="mt-1 whitespace-pre-wrap text-slate-900">{project.features}</dd>
          </div>
        </dl>
      </div>

      {/* Assessment Panel */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-1 text-base font-semibold text-slate-900">Update Assessment</h2>
        <p className="mb-5 text-sm text-slate-500">
          Fields left blank will not overwrite existing values.
        </p>
        <AssessmentForm
          projectId={project.id}
          currentStatus={project.projectStatus}
          allowedTransitions={allowedTransitions}
          currentPartnerPrice={project.partnerPrice?.toString() ?? null}
          currentEstimatedTimeline={project.estimatedTimeline ?? null}
          currentScope={project.scope ?? null}
          currentAdminNotes={project.adminNotes ?? null}
          currentOpportunityStatus={project.opportunityStatus}
        />
      </div>

      {/* Kickoff Review Panel — shown when a kickoff exists */}
      {project.kickoff && (
        <KickoffReviewPanel
          projectId={project.id}
          kickoff={project.kickoff}
          files={project.files}
        />
      )}

      {/* Development Workflow Panel */}
      <WorkflowPanel 
        projectId={project.id} 
        currentStatus={project.projectStatus} 
      />
    </div>
  );
}
