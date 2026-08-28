import { notFound, redirect } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import Link from "next/link";
import { KickoffForm } from "./KickoffForm";
import { KickoffStatus } from "@prisma/client";

export const metadata = {
  title: "Project Kickoff | Cortex Partner Program",
};

export const dynamic = "force-dynamic";

export default async function KickoffPage({
  params,
}: {
  params: { id: string };
}) {
  let session: Awaited<ReturnType<typeof requirePartnerSession>>;
  try {
    session = await requirePartnerSession();
  } catch {
    redirect("/login");
  }

  const { partner } = session;

  // Load project + kickoff + files — IDOR protected
  const project = await db.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      projectNumber: true,
      projectStatus: true,
      partnerId: true,
      kickoff: {
        select: {
          id: true,
          status: true,
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
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project || project.partnerId !== partner.id) {
    notFound();
  }

  // Must have a kickoff (created when proposal was accepted)
  if (!project.kickoff) {
    notFound();
  }

  // Only allow editing if DRAFT or INFORMATION_REQUIRED

  const pageTitle =
    project.kickoff.status === KickoffStatus.INFORMATION_REQUIRED
      ? "Update Kickoff Details"
      : project.kickoff.status === KickoffStatus.DRAFT
      ? "Project Kickoff"
      : "Kickoff Details";

  // Prepare initial form data (strip null/undefined to empty strings for RHF)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { status, id: _, ...kickoffFields } = project.kickoff;
  const initialData = Object.fromEntries(
    Object.entries(kickoffFields).map(([k, v]) => [k, v ?? ""])
  ) as Record<string, string>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link href={`/projects/${project.id}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to {project.projectNumber}
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">{pageTitle}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Project: <span className="font-mono">{project.projectNumber}</span>
          {" · "}
          Status:{" "}
          <span className="font-medium capitalize text-slate-700">
            {status.replace(/_/g, " ")}
          </span>
        </p>
      </div>

      {status === KickoffStatus.SUBMITTED && (
        <div className="rounded-md border border-teal-200 bg-teal-50 p-4 text-sm text-teal-800">
          <p className="font-semibold">Kickoff submitted — awaiting Cortex review</p>
          <p className="mt-1">The Cortex team will review your kickoff details. You will be notified once a decision has been made.</p>
        </div>
      )}

      {status === KickoffStatus.APPROVED && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">✓ Kickoff Approved</p>
          <p className="mt-1">Your project is now ready for development.</p>
        </div>
      )}

      <KickoffForm
        projectId={project.id}
        projectNumber={project.projectNumber}
        initialData={initialData}
        kickoffStatus={status as KickoffStatus}
        uploadedFiles={project.files}
      />
    </div>
  );
}
