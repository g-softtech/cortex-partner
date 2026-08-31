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
  const [showModal, setShowModal] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  const ACTIONABLE_STATUSES: ApplicationStatus[] = [ApplicationStatus.PENDING, ApplicationStatus.MORE_INFORMATION];
  const canTransition = ACTIONABLE_STATUSES.includes(application.status);

  const handleAction = async (newStatus: ApplicationStatus, message?: string) => {
    if (loading) return;
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/partner-applications/${application.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...(message && { message }) }),
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
      setShowModal(false);
      setInfoMessage("");
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
      <div className="bg-card border-border border rounded-lg p-6">
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
                onClick={() => setShowModal(true)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Request More Info
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

      {/* More Info Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-card w-full max-w-md rounded-lg shadow-xl border border-border p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground mb-2">Request More Information</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter the message you want to send to the applicant. This will be included in the email notification they receive.
            </p>
            <textarea
              className="w-full h-32 p-3 text-sm border border-border rounded-md bg-background text-foreground focus:ring-1 focus:ring-blue-500 focus:outline-none mb-4 resize-none"
              placeholder="e.g., Please clarify your occupation and the type of clients you serve."
              value={infoMessage}
              onChange={(e) => setInfoMessage(e.target.value)}
              disabled={loading}
              maxLength={2000}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted border border-border rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(ApplicationStatus.MORE_INFORMATION, infoMessage)}
                disabled={loading || !infoMessage.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Details */}
      <div className="bg-card border-border border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-5">Application Details</h2>
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
