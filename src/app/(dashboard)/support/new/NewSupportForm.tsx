"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { SupportCategory } from "@prisma/client";
import { upload } from "@vercel/blob/client";
import Link from "next/link";

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  BUG: "Bug / Something is broken",
  TECHNICAL_ISSUE: "Technical Issue",
  QUESTION: "General Question",
  PROJECT_SUPPORT: "Project Support",
  OTHER: "Other",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface Project {
  id: string;
  projectNumber: string;
  projectType: string;
}

interface NewSupportFormProps {
  projects: Project[];
}

export default function NewSupportForm({ projects }: NewSupportFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File upload state
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      category: formData.get("category") as string,
      subject: formData.get("subject") as string,
      description: formData.get("description") as string,
      projectId: (formData.get("projectId") as string) || undefined,
    };

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit request");
      }

      const result = await res.json();
      const newSupportId: string = result.supportId;

      // If a file was selected but not yet uploaded (pre-submit), upload now
      if (fileInputRef.current?.files?.[0]) {
        await handleFileUpload(fileInputRef.current.files[0], newSupportId);
      }

      router.push("/support");
      router.refresh();
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("An unexpected error occurred");
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File, supportId: string) => {
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File exceeds the 10 MB limit.");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setUploadError(null);
    setUploadProgress(10);

    try {
      // Step 1: Upload to Vercel Blob
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/files/presign",
        clientPayload: JSON.stringify({ uploadType: "support", supportRequestId: supportId }),
        onUploadProgress: (progress) => {
          setUploadProgress(10 + Math.floor(progress.percentage * 0.65));
        },
      });

      setUploadProgress(75);

      // Step 2: Register in DB
      const registerRes = await fetch(`/api/support/${supportId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newBlob.url,
          originalName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      if (!registerRes.ok) {
        const data = await registerRes.json();
        throw new Error(data.error || "Failed to register file.");
      }

      const { file: registeredFile } = await registerRes.json();
      void registeredFile; // registration confirmed; id not needed in UI
      setUploadProgress(100);
      setUploadStatus("done");
      setUploadedFileName(file.name);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
      setUploadStatus("error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File exceeds the 10 MB limit.");
      setUploadStatus("error");
      return;
    }

    // Preview the name
    setUploadedFileName(file.name);
    setUploadStatus("idle");
    setUploadError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <Link
          href="/support"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ← Back to Support
        </Link>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          New Support Request
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Describe the issue and our team will respond promptly.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              required
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
            >
              <option value="">Select a category...</option>
              {(Object.entries(CATEGORY_LABELS) as [SupportCategory, string][]).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Related Project (Optional) */}
          {projects.length > 0 && (
            <div>
              <label htmlFor="projectId" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Related Project <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </label>
              <select
                id="projectId"
                name="projectId"
                className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
              >
                <option value="">No specific project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectNumber} — {p.projectType.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              id="subject"
              required
              minLength={5}
              maxLength={255}
              placeholder="Brief description of the issue"
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              required
              minLength={10}
              placeholder="Please provide as much detail as possible..."
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>

          {/* Screenshot / File Attachment */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Screenshot or Attachment <span className="text-xs text-slate-400 font-normal">(Optional — max 10 MB)</span>
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Accepted: JPG, PNG, GIF, WEBP, PDF
            </p>
            <div className="mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                disabled={submitting}
                className="block w-full text-sm text-slate-500 dark:text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200
                  hover:file:bg-slate-200 dark:hover:file:bg-slate-600
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {uploadStatus === "uploading" && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                  <div
                    className="h-full bg-slate-900 dark:bg-slate-300 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              {uploadStatus === "done" && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                  ✓ {uploadedFileName} attached.
                </p>
              )}
              {uploadStatus === "error" && uploadError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{uploadError}</p>
              )}
              {uploadedFileName && uploadStatus === "idle" && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Selected: {uploadedFileName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-x-4 border-t border-slate-200 dark:border-slate-700 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadStatus === "uploading"}
              className="rounded-md bg-slate-900 dark:bg-slate-100 px-6 py-2 text-sm font-semibold text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
