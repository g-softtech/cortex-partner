"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectStatus } from "@prisma/client";

interface WorkflowPanelProps {
  projectId: string;
  currentStatus: ProjectStatus;
}

const ADMIN_TRANSITIONS: Record<ProjectStatus, { next: ProjectStatus; label: string }[]> = {
  [ProjectStatus.READY_FOR_DEVELOPMENT]: [{ next: ProjectStatus.DEVELOPMENT, label: "Start Development" }],
  [ProjectStatus.DEVELOPMENT]: [{ next: ProjectStatus.INTERNAL_QA, label: "Send to Internal QA" }],
  [ProjectStatus.INTERNAL_QA]: [{ next: ProjectStatus.PARTNER_REVIEW, label: "Send to Partner Review" }],
  [ProjectStatus.CHANGES]: [{ next: ProjectStatus.PARTNER_REVIEW, label: "Resubmit for Partner Review" }],
  [ProjectStatus.FINAL_APPROVAL]: [{ next: ProjectStatus.DELIVERED, label: "Mark as Delivered" }],
  [ProjectStatus.SUBMITTED]: [],
  [ProjectStatus.UNDER_REVIEW]: [],
  [ProjectStatus.PRICED]: [],
  [ProjectStatus.PROPOSAL_SENT]: [],
  [ProjectStatus.WON]: [],
  [ProjectStatus.KICKOFF_SUBMITTED]: [],
  [ProjectStatus.PARTNER_REVIEW]: [],
  [ProjectStatus.CUSTOMER_REVIEW]: [],
  [ProjectStatus.DELIVERED]: [],
  [ProjectStatus.SUPPORT]: [],
  [ProjectStatus.LOST]: [],
  [ProjectStatus.CANCELLED]: [],
  [ProjectStatus.ARCHIVED]: [],
};

const WORKFLOW_ACTIVE_STATES: ProjectStatus[] = [
  ProjectStatus.READY_FOR_DEVELOPMENT,
  ProjectStatus.DEVELOPMENT,
  ProjectStatus.INTERNAL_QA,
  ProjectStatus.PARTNER_REVIEW,
  ProjectStatus.CUSTOMER_REVIEW,
  ProjectStatus.CHANGES,
  ProjectStatus.FINAL_APPROVAL,
  ProjectStatus.DELIVERED,
];

export default function WorkflowPanel({ projectId, currentStatus }: WorkflowPanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTransitions = ADMIN_TRANSITIONS[currentStatus] || [];
  
  if (!WORKFLOW_ACTIVE_STATES.includes(currentStatus)) {
    return null; // Don't show in pre-kickoff or terminal states
  }

  const handleTransition = async (newStatus: ProjectStatus) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/workflow`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update workflow");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 mb-8 border-slate-200 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-slate-900">Development Workflow</h2>
      <p className="mb-5 text-sm text-slate-500">
        Manage the project&apos;s development lifecycle. Current state: <strong>{currentStatus.replace(/_/g, " ")}</strong>
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {availableTransitions.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {availableTransitions.map((t) => (
              <button
                key={t.next}
                onClick={() => handleTransition(t.next)}
                disabled={isLoading}
                className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 inline-flex items-center"
              >
                {isLoading ? "Processing..." : t.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 italic">
            {currentStatus === ProjectStatus.PARTNER_REVIEW || currentStatus === ProjectStatus.CUSTOMER_REVIEW
              ? "Waiting on Partner to review and approve or report an issue."
              : currentStatus === ProjectStatus.DELIVERED 
              ? "Project has been delivered."
              : "No admin workflow actions available in this state."}
          </p>
        )}
      </div>
    </div>
  );
}
