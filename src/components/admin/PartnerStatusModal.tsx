"use client";

import React, { useState } from "react";

interface PartnerItem {
  id: string;
  partnerId: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  user: {
    name: string | null;
    email: string;
  };
}

interface PartnerStatusModalProps {
  partner: PartnerItem | null;
  action: "SUSPEND" | "REACTIVATE" | "REVOKE" | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PartnerStatusModal({
  partner,
  action,
  onClose,
  onSuccess,
}: PartnerStatusModalProps) {
  const [reason, setReason] = useState("");
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!partner || !action) return null;

  const isRevoke = action === "REVOKE";
  const isSuspend = action === "SUSPEND";
  const isReactivate = action === "REACTIVATE";

  const isConfirmDisabled = isRevoke && confirmInput.trim() !== partner.partnerId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmDisabled || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/partners/${partner.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update partner status.");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-2">
            {isSuspend && "Suspend Partner Account"}
            {isReactivate && "Reactivate Partner Account"}
            {isRevoke && "Revoke Partner Account"}
          </h3>

          <p className="text-sm text-muted-foreground mb-4">
            Partner: <span className="font-semibold text-foreground">{partner.user.name || "Partner"}</span> ({partner.partnerId})
          </p>

          {isRevoke && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
              <strong>Warning:</strong> This will permanently revoke active partner dashboard and API access. All project, agreement, support, and financial records will be retained for audit compliance.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSuspend && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Reason for Suspension (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter administrative reason..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {isRevoke && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Type <span className="font-bold text-foreground">{partner.partnerId}</span> to confirm revocation:
                </label>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  placeholder={partner.partnerId}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-destructive"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isConfirmDisabled || loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${
                  isRevoke
                    ? "bg-destructive hover:bg-destructive/90 disabled:opacity-50"
                    : isSuspend
                    ? "bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                    : "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                }`}
              >
                {loading
                  ? "Processing..."
                  : isSuspend
                  ? "Confirm Suspension"
                  : isReactivate
                  ? "Confirm Reactivation"
                  : "Confirm Revocation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
