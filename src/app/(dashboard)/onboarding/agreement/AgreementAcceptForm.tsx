"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PARTNER_AGREEMENT_V1_0 } from "@/lib/agreements/partner-agreement";

interface AgreementAcceptFormProps {
  version: string;
}

export default function AgreementAcceptForm({ version }: AgreementAcceptFormProps) {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!accepted) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/partners/accept-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to record agreement acceptance.");
      }

      // Redirect to dashboard after acceptance
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setSubmitting(false);
    }
  };

  const agreementText = version === "1.0" ? PARTNER_AGREEMENT_V1_0 : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Cortex Partner Agreement
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Version {version} — Please read the agreement carefully before accepting.
        </p>
      </div>

      {/* Agreement Text */}
      {agreementText && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Agreement Text — Version {version}
            </p>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {agreementText}
            </pre>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Acceptance Checkbox */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            id="accept-agreement"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            I confirm that I have read and understood the Cortex Partner Agreement Version {version}, and I agree to be bound by its terms.
          </span>
        </label>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleAccept}
            disabled={!accepted || submitting}
            className="w-full sm:w-auto rounded-md bg-slate-900 dark:bg-slate-100 px-8 py-2.5 text-sm font-semibold text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Saving..." : "Accept Agreement & Continue"}
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Your acceptance is recorded with a timestamp for your records.
          </p>
        </div>
      </div>
    </div>
  );
}
