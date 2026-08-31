"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectStatus } from "@prisma/client";

interface ReviewPanelProps {
  projectId: string;
  currentStatus: ProjectStatus;
}

export default function ReviewPanel({ projectId, currentStatus }: ReviewPanelProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (currentStatus !== ProjectStatus.PARTNER_REVIEW && currentStatus !== ProjectStatus.CUSTOMER_REVIEW) {
    return null;
  }

  const isFinalApproval = currentStatus === ProjectStatus.CUSTOMER_REVIEW;

  const handleAction = async (action: "APPROVE" | "REPORT_ISSUE") => {
    if (action === "REPORT_ISSUE" && !issueDescription.trim()) {
      setError("Please provide a description of the issue.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action, 
          issueDescription: action === "REPORT_ISSUE" ? issueDescription : undefined 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setSuccess(action === "APPROVE" ? "Project approved successfully" : "Issue reported successfully");
      setIsReportingIssue(false);
      setIssueDescription("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-blue-50/50 p-6 mb-8 border-blue-200 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-blue-900 flex items-center">
        {isFinalApproval ? "Final Customer Approval Required" : "Partner Review Required"}
      </h2>
      <p className="mb-5 text-sm text-blue-700/80">
        {isFinalApproval 
          ? "The project is now in Customer Review. Please review the deliverables with your customer and provide final approval."
          : "The project has passed internal QA and is ready for your review. Please review the current state of the project."}
      </p>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div>
        {isReportingIssue ? (
          <div className="space-y-4">
            <textarea
              placeholder="Describe the issue or required changes in detail..."
              value={issueDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setIssueDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[120px] bg-white dark:bg-slate-800"
              disabled={isLoading}
            />
            <div className="flex gap-3">
              <button 
                onClick={() => handleAction("REPORT_ISSUE")}
                disabled={isLoading}
                className="rounded-md bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading ? "Submitting..." : "Submit Issue"}
              </button>
              <button 
                onClick={() => {
                  setIsReportingIssue(false);
                  setIssueDescription("");
                  setError(null);
                }}
                disabled={isLoading}
                className="rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            <button 
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={() => handleAction("APPROVE")}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : (isFinalApproval ? "Approve for Delivery" : "Approve & Continue")}
            </button>
            <button 
              className="rounded-md bg-white dark:bg-slate-800 border border-red-200 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 hover:text-red-800 disabled:opacity-50"
              onClick={() => setIsReportingIssue(true)}
              disabled={isLoading}
            >
              Report Issue / Request Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
