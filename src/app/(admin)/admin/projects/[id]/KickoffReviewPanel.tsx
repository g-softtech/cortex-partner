"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KickoffStatus } from "@prisma/client";

interface KickoffData {
  id: string;
  status: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  approvedAt: Date | null;
  businessName: string | null;
  businessDescription: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  brandGuidelines: string | null;
  contentAbout: string | null;
  contentServices: string | null;
  contentProducts: string | null;
  contactInfo: string | null;
  socialLinks: string | null;
  requiredPages: string | null;
  agreedFeatures: string | null;
  integrations: string | null;
  domain: string | null;
  hostingStatus: string | null;
  designReferences: string | null;
}

interface FileData {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  category: string;
  createdAt: Date;
}

interface KickoffReviewPanelProps {
  projectId: string;
  kickoff: KickoffData;
  files: FileData[];
}

const KICKOFF_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-blue-100 text-blue-800",
  INFORMATION_REQUIRED: "bg-orange-100 text-orange-800",
  APPROVED: "bg-green-100 text-green-800",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export function KickoffReviewPanel({ projectId, kickoff, files }: KickoffReviewPanelProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const canReview = kickoff.status === KickoffStatus.SUBMITTED;

  const handleDownload = async (fileId: string) => {
    setDownloadingId(fileId);
    try {
      const res = await fetch(`/api/files/download/${fileId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Open the presigned URL
      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReview = async (decision: "APPROVED" | "INFORMATION_REQUIRED") => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/kickoff/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, adminNotes: adminNotes || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Review failed.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white dark:bg-slate-800 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Kickoff Details</h2>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            KICKOFF_STATUS_COLORS[kickoff.status] ?? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          {kickoff.status.replace(/_/g, " ")}
        </span>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {kickoff.submittedAt && (
        <p className="text-xs text-slate-400">
          Submitted: {new Date(kickoff.submittedAt).toLocaleString("en-GB")}
        </p>
      )}

      {/* Business Info */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Business Information</h3>
        <dl className="space-y-3">
          <Field label="Business Name" value={kickoff.businessName} />
          <Field label="Business Description" value={kickoff.businessDescription} />
        </dl>
      </div>

      {/* Branding */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Branding</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Primary Colour" value={kickoff.primaryColor} />
          <Field label="Secondary Colour" value={kickoff.secondaryColor} />
          <div className="sm:col-span-2">
            <Field label="Brand Guidelines" value={kickoff.brandGuidelines} />
          </div>
        </dl>
      </div>

      {/* Content */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Content</h3>
        <dl className="space-y-3">
          <Field label="About" value={kickoff.contentAbout} />
          <Field label="Services" value={kickoff.contentServices} />
          <Field label="Products" value={kickoff.contentProducts} />
          <Field label="Contact Info" value={kickoff.contactInfo} />
          <Field label="Social Links" value={kickoff.socialLinks} />
        </dl>
      </div>

      {/* Technical */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Technical Details</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Domain" value={kickoff.domain} />
          <Field label="Hosting Status" value={kickoff.hostingStatus} />
          <div className="sm:col-span-2">
            <Field label="Required Pages" value={kickoff.requiredPages} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Agreed Features" value={kickoff.agreedFeatures} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Integrations" value={kickoff.integrations} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Design References" value={kickoff.designReferences} />
          </div>
        </dl>
      </div>

      {/* Files */}
      {files.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">Uploaded Files</h3>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <span className="flex-1 truncate text-slate-900 dark:text-slate-100">{f.originalName}</span>
                <span className="text-slate-400">{formatFileSize(f.fileSize)}</span>
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
                  {f.category}
                </span>
                <button
                  onClick={() => handleDownload(f.id)}
                  disabled={downloadingId === f.id}
                  className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                >
                  {downloadingId === f.id ? "Loading…" : "Download"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Review Actions */}
      {canReview && (
        <div className="border-t pt-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Review Decision</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Admin Notes (visible to admin only)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              className="block w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Internal notes about this kickoff review…"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleReview("APPROVED")}
              disabled={isSubmitting}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "Processing…" : "Approve Kickoff"}
            </button>
            <button
              onClick={() => handleReview("INFORMATION_REQUIRED")}
              disabled={isSubmitting}
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
            >
              Request More Information
            </button>
          </div>
        </div>
      )}

      {kickoff.approvedAt && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          ✓ Kickoff approved on{" "}
          {new Date(kickoff.approvedAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
        </div>
      )}
    </div>
  );
}
