"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { SupportStatus } from "@prisma/client";

interface SupportRequest {
  id: string;
  supportNumber: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  adminResponse: string | null;
  internalNote: string | null;
  partner: {
    user: {
      name: string;
      email: string;
    };
  };
}

export default function AdminSupportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState<string>("");
  const [internalNote, setInternalNote] = useState<string>("");

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/admin/support`);
        if (res.ok) {
          const data = await res.json();
          const req = data.find((r: SupportRequest) => r.id === id);
          if (req) {
            setRequest(req);
            setAdminResponse(req.adminResponse || "");
            setInternalNote(req.internalNote || "");
          } else {
            router.push("/admin/support");
          }
        }
      } catch (err) {
        console.error("Failed to load support request:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [id, router]);

  const handleUpdate = async (newStatus?: string) => {
    setUpdating(true);
    setError(null);

    const statusToUpdate = newStatus || request?.status;

    try {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusToUpdate, adminResponse, internalNote }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }

      const data = await res.json();
      setRequest((prev) => (prev ? { ...prev, status: data.supportRequest.status } : null));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/support"
          className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100"
        >
          &larr; Back to Support Requests
        </Link>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
            <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
                Support Request {request.supportNumber}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                Submitted on {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Subject</dt>
                  <dd className="mt-1 text-base text-slate-900 dark:text-slate-100 font-medium">{request.subject}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</dt>
                  <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap rounded-md bg-slate-50 dark:bg-slate-900/50 p-4 ring-1 ring-inset ring-slate-200">
                    {request.description}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
            <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-5 sm:px-6">
              <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
                Cortex Response
              </h3>
            </div>
            <div className="px-4 py-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Response to Partner
                </label>
                <textarea
                  rows={4}
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  disabled={updating}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100 sm:text-sm"
                  placeholder="Enter response..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Internal Note <span className="text-xs text-red-500">(Never shown to partner)</span>
                </label>
                <textarea
                  rows={3}
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  disabled={updating}
                  className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-700 px-3 py-2 shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100 sm:text-sm"
                  placeholder="Internal team notes..."
                />
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => handleUpdate()}
                  disabled={updating}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Save Response
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
            <div className="px-4 py-5 sm:p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</h4>
                <div className="mt-2">
                  <select
                    value={request.status}
                    onChange={(e) => handleUpdate(e.target.value)}
                    disabled={updating}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-slate-900 sm:text-sm sm:leading-6 disabled:opacity-50"
                  >
                    {Object.values(SupportStatus).map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Category</h4>
                <p className="mt-1 text-sm text-slate-900 dark:text-slate-100">{request.category.replace(/_/g, " ")}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Partner Details</h4>
                <div className="mt-2 space-y-2 text-sm text-slate-900 dark:text-slate-100">
                  <p className="font-medium">{request.partner.user.name}</p>
                  <p className="text-slate-500 dark:text-slate-400">{request.partner.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
