"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/validations/resolver";
import { kickoffSaveSchema, KickoffSaveInput } from "@/lib/validations/kickoff";
import { FileUpload } from "@/components/ui/FileUpload";
import { KickoffStatus } from "@prisma/client";

interface KickoffFormProps {
  projectId: string;
  projectNumber: string;
  initialData: Partial<KickoffSaveInput>;
  kickoffStatus: KickoffStatus;
  uploadedFiles: Array<{ id: string; originalName: string; fileType: string; fileSize: number; category: string }>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function KickoffForm({
  projectId,
  initialData,
  kickoffStatus,
  uploadedFiles: initialFiles,
}: KickoffFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState(initialFiles);

  const isReadOnly = kickoffStatus !== KickoffStatus.DRAFT && kickoffStatus !== KickoffStatus.INFORMATION_REQUIRED;

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<KickoffSaveInput>({
    resolver: zodResolver(kickoffSaveSchema),
    defaultValues: initialData,
  });

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setError(null);
    const values = getValues();
    try {
      const res = await fetch(`/api/projects/${projectId}/kickoff?action=save`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed.");
      setSaveMessage("Draft saved.");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmit = async (data: KickoffSaveInput) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/kickoff?action=submit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || "Submission failed.");
      router.push(`/projects/${projectId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {kickoffStatus === KickoffStatus.INFORMATION_REQUIRED && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Additional information required</p>
          <p className="mt-1">The Cortex team has reviewed your kickoff and requires more information. Please update the relevant sections and resubmit.</p>
        </div>
      )}

      {/* Section: Business Info */}
      <div className="rounded-lg border bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900">Business Information</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">Business Name *</label>
          <input
            {...register("businessName")}
            disabled={isReadOnly}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
          />
          {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Business Description *</label>
          <textarea
            {...register("businessDescription")}
            rows={4}
            disabled={isReadOnly}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            placeholder="Describe what your client's business does, their customers, and unique selling points..."
          />
          {errors.businessDescription && <p className="mt-1 text-sm text-red-600">{errors.businessDescription.message}</p>}
        </div>
      </div>

      {/* Section: Branding */}
      <div className="rounded-lg border bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900">Branding</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Primary Colour</label>
            <input
              {...register("primaryColor")}
              disabled={isReadOnly}
              placeholder="#3B82F6 or 'Royal Blue'"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Secondary Colour</label>
            <input
              {...register("secondaryColor")}
              disabled={isReadOnly}
              placeholder="#F9FAFB or 'Light Grey'"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Brand Guidelines</label>
          <textarea
            {...register("brandGuidelines")}
            rows={3}
            disabled={isReadOnly}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            placeholder="Describe any brand guidelines, fonts, styles, or tone of voice..."
          />
        </div>
        {!isReadOnly && (
          <FileUpload
            projectId={projectId}
            category="LOGO"
            label="Logo Upload"
            accept="image/*,application/pdf"
            onUploaded={(f) => setFiles((prev) => [...prev, { ...f, category: "LOGO" }])}
          />
        )}
      </div>

      {/* Section: Content */}
      <div className="rounded-lg border bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900">Content</h2>
        {[
          { field: "contentAbout" as const, label: "About / Story" },
          { field: "contentServices" as const, label: "Services" },
          { field: "contentProducts" as const, label: "Products" },
          { field: "contactInfo" as const, label: "Contact Information" },
          { field: "socialLinks" as const, label: "Social Media Links" },
        ].map(({ field, label }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            <textarea
              {...register(field)}
              rows={3}
              disabled={isReadOnly}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            />
          </div>
        ))}
      </div>

      {/* Section: Technical */}
      <div className="rounded-lg border bg-white p-6 space-y-5">
        <h2 className="text-base font-semibold text-slate-900">Technical Details</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Domain</label>
            <input
              {...register("domain")}
              disabled={isReadOnly}
              placeholder="example.com"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Hosting Status</label>
            <input
              {...register("hostingStatus")}
              disabled={isReadOnly}
              placeholder="e.g. Existing cPanel, Need new hosting..."
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            />
          </div>
        </div>
        {[
          { field: "requiredPages" as const, label: "Required Pages" },
          { field: "agreedFeatures" as const, label: "Agreed Features" },
          { field: "integrations" as const, label: "Integrations / Third-Party Tools" },
          { field: "designReferences" as const, label: "Design References / Inspiration URLs" },
        ].map(({ field, label }) => (
          <div key={field}>
            <label className="block text-sm font-medium text-slate-700">{label}</label>
            <textarea
              {...register(field)}
              rows={3}
              disabled={isReadOnly}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-500 disabled:bg-slate-50"
            />
          </div>
        ))}
        {!isReadOnly && (
          <FileUpload
            projectId={projectId}
            category="DOCUMENT"
            label="Supporting Documents"
            accept=".pdf,.doc,.docx,.txt"
            onUploaded={(f) => setFiles((prev) => [...prev, { ...f, category: "DOCUMENT" }])}
          />
        )}
      </div>

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Uploaded Files</h2>
          <ul className="divide-y divide-slate-100">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-3 py-3 text-sm">
                <svg className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
                <span className="flex-1 truncate text-slate-900">{f.originalName}</span>
                <span className="text-slate-400">{formatFileSize(f.fileSize)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{f.category}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-white p-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isSubmitting}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            {saveMessage && <span className="text-sm text-green-600">{saveMessage}</span>}
          </div>
          <button
            type="submit"
            disabled={isSaving || isSubmitting}
            className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : "Submit Kickoff"}
          </button>
        </div>
      )}
    </form>
  );
}
