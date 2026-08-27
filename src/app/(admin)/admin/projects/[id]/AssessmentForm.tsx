"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/validations/resolver";
import { assessmentSchema, AssessmentInput } from "@/lib/validations/assessment";
import { ProjectStatus, OpportunityStatus } from "@prisma/client";

const OPPORTUNITY_OPTIONS: OpportunityStatus[] = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"];

interface AssessmentFormProps {
  projectId: string;
  currentStatus: ProjectStatus;
  allowedTransitions: ProjectStatus[];
  currentPartnerPrice: string | null;
  currentEstimatedTimeline: string | null;
  currentScope: string | null;
  currentAdminNotes: string | null;
  currentOpportunityStatus: OpportunityStatus;
}

export function AssessmentForm({
  projectId,
  currentStatus,
  allowedTransitions,
  currentPartnerPrice,
  currentEstimatedTimeline,
  currentScope,
  currentAdminNotes,
  currentOpportunityStatus,
}: AssessmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssessmentInput>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      partnerPrice:       currentPartnerPrice ?? "",
      estimatedTimeline:  currentEstimatedTimeline ?? "",
      scope:              currentScope ?? "",
      adminNotes:         currentAdminNotes ?? "",
      opportunityStatus:  currentOpportunityStatus,
      newStatus:          undefined,
    },
  });

  const onSubmit = async (data: AssessmentInput) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Strip empty optional strings so they are not sent as ""
    const payload: Partial<AssessmentInput> = {};
    if (data.partnerPrice)       payload.partnerPrice       = data.partnerPrice;
    if (data.estimatedTimeline)  payload.estimatedTimeline  = data.estimatedTimeline;
    if (data.scope)              payload.scope              = data.scope;
    if (data.adminNotes)         payload.adminNotes         = data.adminNotes;
    if (data.opportunityStatus)  payload.opportunityStatus  = data.opportunityStatus;
    if (data.newStatus)          payload.newStatus          = data.newStatus;

    try {
      const res = await fetch(`/api/admin/projects/${projectId}/assess`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Assessment failed.");
      }

      setSuccess(`Project updated to ${responseData.projectStatus}.`);
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="partnerPrice" className="block text-sm font-medium text-slate-700">
            Partner Price (£)
          </label>
          <p className="mb-1 text-xs text-slate-400">Enter as a decimal string, e.g. 1500.00</p>
          <input
            id="partnerPrice"
            type="text"
            inputMode="decimal"
            {...register("partnerPrice")}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            placeholder="e.g. 1500.00"
            disabled={isSubmitting}
          />
          {errors.partnerPrice && (
            <p className="mt-1 text-sm text-red-600">{errors.partnerPrice.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="estimatedTimeline" className="block text-sm font-medium text-slate-700">
            Estimated Timeline
          </label>
          <input
            id="estimatedTimeline"
            type="text"
            {...register("estimatedTimeline")}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            placeholder="e.g. 6–8 weeks"
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div>
        <label htmlFor="scope" className="block text-sm font-medium text-slate-700">
          Scope
        </label>
        <textarea
          id="scope"
          rows={4}
          {...register("scope")}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Describe the agreed scope of work..."
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor="adminNotes" className="block text-sm font-medium text-slate-700">
          Admin Notes{" "}
          <span className="text-xs font-normal text-slate-400">(Internal — never shown to partner)</span>
        </label>
        <textarea
          id="adminNotes"
          rows={3}
          {...register("adminNotes")}
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          placeholder="Internal notes for the Cortex team..."
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="opportunityStatus" className="block text-sm font-medium text-slate-700">
            Opportunity
          </label>
          <select
            id="opportunityStatus"
            {...register("opportunityStatus")}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            disabled={isSubmitting}
          >
            {OPPORTUNITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="newStatus" className="block text-sm font-medium text-slate-700">
            Transition Status
          </label>
          <p className="mb-1 text-xs text-slate-400">Current: {currentStatus.replace(/_/g, " ")}</p>
          <select
            id="newStatus"
            {...register("newStatus")}
            className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            disabled={isSubmitting || allowedTransitions.length === 0}
          >
            <option value="">— No change —</option>
            {allowedTransitions.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          {allowedTransitions.length === 0 && (
            <p className="mt-1 text-xs text-slate-400">This status is terminal. No further transitions.</p>
          )}
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Assessment"}
        </button>
      </div>
    </form>
  );
}
