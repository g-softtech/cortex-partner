"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PartnerStatusModal } from "@/components/admin/PartnerStatusModal";

export interface PartnerItem {
  id: string;
  partnerId: string;
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE";
  joinedAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    projects: number;
  };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  from: number;
  to: number;
}

interface PartnerManagementTableProps {
  initialPartners: PartnerItem[];
  pagination: PaginationMeta;
}

export function PartnerManagementTable({ initialPartners, pagination }: PartnerManagementTableProps) {
  const router = useRouter();
  const [partners, setPartners] = useState<PartnerItem[]>(initialPartners);
  const [selectedPartner, setSelectedPartner] = useState<PartnerItem | null>(null);
  const [modalAction, setModalAction] = useState<"SUSPEND" | "REACTIVATE" | "REVOKE" | null>(null);

  // Sync state when props change (e.g. page navigation)
  React.useEffect(() => {
    setPartners(initialPartners);
  }, [initialPartners]);

  const handleOpenModal = (partner: PartnerItem, action: "SUSPEND" | "REACTIVATE" | "REVOKE") => {
    setSelectedPartner(partner);
    setModalAction(action);
  };

  const handleCloseModal = () => {
    setSelectedPartner(null);
    setModalAction(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    router.refresh();
  };

  const hasPrevious = pagination.page > 1;
  const hasNext = pagination.totalPages > 0 && pagination.page < pagination.totalPages;

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4">Partner ID</th>
              <th className="px-6 py-4">Partner Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Projects</th>
              <th className="px-6 py-4">Joined Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  No partners found.
                </td>
              </tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-foreground">
                    {partner.partnerId}
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">
                    {partner.user.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {partner.user.email}
                  </td>
                  <td className="px-6 py-4">
                    {partner.status === "ACTIVE" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ACTIVE
                      </span>
                    )}
                    {partner.status === "SUSPENDED" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        SUSPENDED
                      </span>
                    )}
                    {partner.status === "INACTIVE" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        REVOKED
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {partner._count?.projects ?? 0}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(partner.joinedAt || partner.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {partner.status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => handleOpenModal(partner, "SUSPEND")}
                          className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md transition-colors"
                        >
                          Suspend
                        </button>
                        <button
                          onClick={() => handleOpenModal(partner, "REVOKE")}
                          className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
                        >
                          Revoke
                        </button>
                      </>
                    )}

                    {partner.status === "SUSPENDED" && (
                      <>
                        <button
                          onClick={() => handleOpenModal(partner, "REACTIVATE")}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md transition-colors"
                        >
                          Reactivate
                        </button>
                        <button
                          onClick={() => handleOpenModal(partner, "REVOKE")}
                          className="px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-md transition-colors"
                        >
                          Revoke
                        </button>
                      </>
                    )}

                    {partner.status === "INACTIVE" && (
                      <span className="text-xs italic text-muted-foreground">
                        No actions (Revoked)
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <div>
          Showing <span className="font-medium text-foreground">{pagination.from}</span>–
          <span className="font-medium text-foreground">{pagination.to}</span> of{" "}
          <span className="font-medium text-foreground">{pagination.total}</span>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/partners?page=${pagination.page - 1}`}
              className={`px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-card transition-colors ${
                hasPrevious
                  ? "hover:bg-accent/50 text-foreground"
                  : "pointer-events-none opacity-40 text-muted-foreground"
              }`}
              aria-disabled={!hasPrevious}
            >
              ← Previous
            </Link>

            <span className="text-xs font-medium text-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <Link
              href={`/admin/partners?page=${pagination.page + 1}`}
              className={`px-3 py-1.5 text-xs font-medium border border-border rounded-lg bg-card transition-colors ${
                hasNext
                  ? "hover:bg-accent/50 text-foreground"
                  : "pointer-events-none opacity-40 text-muted-foreground"
              }`}
              aria-disabled={!hasNext}
            >
              Next →
            </Link>
          </div>
        )}
      </div>

      <PartnerStatusModal
        partner={selectedPartner}
        action={modalAction}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
