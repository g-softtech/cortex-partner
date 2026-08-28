"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AcceptProposalButtonProps {
  projectId: string;
  projectNumber: string;
}

export function AcceptProposalButton({ projectId, projectNumber }: AcceptProposalButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/accept`, { method: "PATCH" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept proposal.");
      }

      // Navigate to the kickoff form
      router.push(`/projects/${projectId}/kickoff`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-indigo-900">Ready to proceed with {projectNumber}?</h3>
          <p className="mt-1 text-sm text-indigo-700">
            By accepting this proposal you agree to the listed price, scope, and timeline. 
            You will then be prompted to complete the project kickoff details.
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          {!confirmed ? (
            <button
              onClick={() => setConfirmed(true)}
              className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none"
            >
              Accept Proposal
            </button>
          ) : (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-sm font-medium text-indigo-900">Are you sure? This cannot be undone.</p>
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? "Accepting..." : "Yes, Accept Proposal"}
              </button>
              <button
                onClick={() => setConfirmed(false)}
                disabled={isLoading}
                className="rounded-md border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
