"use client";

import { useState } from "react";
import { ApplicationStatus } from "@prisma/client";
import { useRouter } from "next/navigation";

type Application = {
  id: string;
  applicationNumber: string;
  name: string;
  email: string;
  phone: string;
  occupation: string;
  hasPotentialClients: boolean;
  potentialClientType?: string | null;
  reason: string;
  source?: string | null;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  partner?: { partnerId: string; status: string } | null;
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
  MORE_INFORMATION: "More Info Required",
};

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  MORE_INFORMATION: "bg-blue-100 text-blue-800",
};

export default function ApplicationDetailClient({ application }: { application: Application }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ACTIONABLE_STATUSES: ApplicationStatus[] = [ApplicationStatus.PENDING, ApplicationStatus.MORE_INFORMATION];
  const canTransition = ACTIONABLE_STATUSES.includes(application.status);

  const handleAction = async (newStatus: ApplicationStatus) => {
    if (loading) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/partner-applications/${application.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "An error occurred.");
        return;
      }

      if (newStatus === ApplicationStatus.APPROVED) {
        setSuccess(
          `Application ${data.applicationNumber} approved. Partner ID: ${data.partnerId}. ` +
            `Setup token generated (expires ${new Date(data.setupTokenExpiresAt).toLocaleString()}).`
        );
      } else {
        setSuccess(`Status updated to ${STATUS_LABELS[newStatus]}.`);
      }

      // Refresh the page data
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status + Actions */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Status</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[application.status]}`}>
              {STATUS_LABELS[application.status]}
            </span>
          </div>
          {application.partner && (
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Partner ID</p>
              <span className="font-mono font-bold text-slate-900">{application.partner.partnerId}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md mb-4 whitespace-pre-line">
            {success}
          </div>
        )}

        {canTransition && (
          <div className="flex gap-3 flex-wrap pt-2">
            {application.status !== ApplicationStatus.APPROVED && (
              <button
                id="btn-approve"
                onClick={() => handleAction(ApplicationStatus.APPROVED)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Approve"}
              </button>
            )}
            {application.status === ApplicationStatus.PENDING && (
              <button
                id="btn-more-info"
                onClick={() => handleAction(ApplicationStatus.MORE_INFORMATION)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Processing..." : "Request More Info"}
              </button>
            )}
            <button
              id="btn-decline"
              onClick={() => handleAction(ApplicationStatus.DECLINED)}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Decline"}
            </button>
          </div>
        )}

        {!canTransition && (
          <p className="text-sm text-slate-500 mt-2">
            This application is in a terminal state and cannot be transitioned further.
          </p>
        )}
      </div>

      {/* Application Details */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Application Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Application Number</dt>
            <dd className="font-mono text-slate-900">{application.applicationNumber}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Submitted</dt>
            <dd className="text-slate-900">
              {new Date(application.createdAt).toLocaleString("en-GB", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Full Name</dt>
            <dd className="text-slate-900 font-medium">{application.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Email</dt>
            <dd className="text-slate-900">{application.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Phone</dt>
            <dd className="text-slate-900">{application.phone}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Occupation</dt>
            <dd className="text-slate-900">{application.occupation}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Has Potential Clients</dt>
            <dd className="text-slate-900">{application.hasPotentialClients ? "Yes" : "No"}</dd>
          </div>
          {application.potentialClientType && (
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Client Type</dt>
              <dd className="text-slate-900">{application.potentialClientType}</dd>
            </div>
          )}
          {application.source && (
            <div>
              <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">How They Found Us</dt>
              <dd className="text-slate-900">{application.source}</dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500 uppercase tracking-widest mb-1">Reason for Joining</dt>
            <dd className="text-slate-900 whitespace-pre-wrap">{application.reason}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
