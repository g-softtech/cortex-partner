import { notFound, redirect } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProjectStatus } from "@prisma/client";
import Link from "next/link";
import { ChangeRequestForm } from "./ChangeRequestForm";

export const metadata = {
  title: "Change Requests | Cortex Partner Program",
};

export const dynamic = "force-dynamic";

export default async function ChangeRequestsPage({
  params,
}: {
  params: { id: string };
}) {
  let session;
  try {
    session = await requirePartnerSession();
  } catch {
    redirect("/login");
  }

  const { partner } = session;

  const project = await db.project.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      projectNumber: true,
      projectStatus: true,
      partnerId: true,
      changeRequests: {
        orderBy: { createdAt: "desc" },
        include: {
          files: true,
        },
      },
    },
  });

  if (!project || project.partnerId !== partner.id) {
    notFound();
  }

  if (project.projectStatus !== ProjectStatus.DELIVERED && project.projectStatus !== ProjectStatus.SUPPORT) {
    return (
      <div className="space-y-6">
        <div>
          <Link href={`/projects/${project.id}`} className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to {project.projectNumber}
          </Link>
        </div>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Change requests can only be submitted for completed projects (Delivered or Support states).
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/projects/${project.id}`} className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to {project.projectNumber}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Change Requests</h1>
        <p className="mt-1 text-sm text-slate-500">
          Submit and track modifications for {project.projectNumber}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">New Change Request</h2>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <ChangeRequestForm projectId={project.id} />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Past Requests</h2>
          {project.changeRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No change requests have been submitted yet.
            </div>
          ) : (
            <div className="space-y-4">
              {project.changeRequests.map((cr) => (
                <div key={cr.id} className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      {new Date(cr.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                      {cr.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-900 whitespace-pre-wrap">{cr.description}</p>
                  
                  {cr.explanation && (
                    <div className="mt-4 rounded-md bg-slate-50 p-4 text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">Cortex Response:</p>
                      <p className="mt-1">{cr.explanation}</p>
                    </div>
                  )}

                  {cr.files.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold text-slate-500 mb-2">ATTACHED FILES</p>
                      <ul className="space-y-1">
                        {cr.files.map((file) => (
                          <li key={file.id} className="text-sm">
                            <a 
                              href={`/api/files/download/${file.id}`}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              📄 {file.originalName} ({(file.fileSize / 1024 / 1024).toFixed(1)} MB)
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/projects/${project.id}/changes/${cr.id}`}
                      className="text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                      Manage Attachments →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
