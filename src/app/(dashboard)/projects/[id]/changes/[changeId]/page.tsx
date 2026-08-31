import { notFound, redirect } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import Link from "next/link";
import { ChangeRequestFileUpload } from "@/components/ui/ChangeRequestFileUpload";

export const dynamic = "force-dynamic";

export default async function ChangeRequestDetailPage({
  params,
}: {
  params: { id: string; changeId: string };
}) {
  let session;
  try {
    session = await requirePartnerSession();
  } catch {
    redirect("/login");
  }

  const { partner } = session;

  const changeRequest = await db.changeRequest.findUnique({
    where: { id: params.changeId },
    include: {
      project: { select: { id: true, partnerId: true, projectNumber: true } },
      files: true,
    },
  });

  if (!changeRequest || changeRequest.projectId !== params.id || changeRequest.project.partnerId !== partner.id) {
    notFound();
  }

  // Reload the page on successful upload to see the new file
  const canUpload = changeRequest.status === "SUBMITTED" || changeRequest.status === "UNDER_REVIEW";

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/projects/${params.id}/changes`} className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300">
          ← Back to Change Requests
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">Manage Attachments</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add files to your change request for project <span className="font-mono">{changeRequest.project.projectNumber}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-white dark:bg-slate-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Request Details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status</p>
              <p className="mt-1 font-medium">{changeRequest.status.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Description</p>
              <p className="mt-1 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{changeRequest.description}</p>
            </div>
            {changeRequest.explanation && (
              <div className="rounded-md bg-slate-50 dark:bg-slate-900/50 p-4 text-sm text-slate-700 dark:text-slate-300 mt-4">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Cortex Response:</p>
                <p className="mt-1">{changeRequest.explanation}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border bg-white dark:bg-slate-800 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">Attached Files</h2>
            {changeRequest.files.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 italic">No files attached yet.</p>
            ) : (
              <ul className="space-y-2">
                {changeRequest.files.map((file) => (
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
            )}
          </div>

          {canUpload && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Upload New File</h3>
              <ChangeRequestFileUpload
                projectId={params.id}
                changeRequestId={params.changeId}
                label="Select file (max 10MB)"
                // Optionally add an onUploaded callback to refresh the page/component
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                You can upload images or documents to help explain the changes needed. 
                Refresh the page to see newly uploaded files.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
