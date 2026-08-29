"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RequestStatus } from "@prisma/client";

interface ChangeRequest {
  id: string;
  description: string;
  explanation: string | null;
  status: RequestStatus;
  createdAt: Date;
  files: Array<{
    id: string;
    originalName: string;
    fileSize: number;
  }>;
}

interface AdminChangeRequestsPanelProps {
  projectId: string;
  changeRequests: ChangeRequest[];
}

export function AdminChangeRequestsPanel({ projectId, changeRequests }: AdminChangeRequestsPanelProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RequestStatus>(RequestStatus.SUBMITTED);
  const [explanation, setExplanation] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEditing = (cr: ChangeRequest) => {
    setEditingId(cr.id);
    setSelectedStatus(cr.status);
    setExplanation(cr.explanation ?? "");
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setError(null);
  };

  const saveChangeRequest = async (crId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/changes/${crId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          explanation: explanation.trim() !== "" ? explanation : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      setEditingId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-slate-900">Change Requests</h2>
      
      <div className="space-y-6">
        {changeRequests.map((cr) => {
          const isEditing = editingId === cr.id;
          
          return (
            <div key={cr.id} className="rounded-lg border bg-slate-50 p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Submitted {new Date(cr.createdAt).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-800 border">
                  {cr.status.replace(/_/g, " ")}
                </span>
              </div>
              
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase">Partner Request</p>
                <p className="mt-1 text-sm text-slate-900 whitespace-pre-wrap">{cr.description}</p>
              </div>

              {cr.files.length > 0 && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">ATTACHED FILES</p>
                  <ul className="space-y-1">
                    {cr.files.map((file) => (
                      <li key={file.id} className="text-sm">
                        <a
                          href={`/api/files/download/${file.id}`}
                          className="text-blue-600 hover:underline flex items-center gap-1"
                          target="_blank"
                          rel="noreferrer"
                        >
                          📄 {file.originalName} ({(file.fileSize / 1024 / 1024).toFixed(1)} MB)
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {isEditing ? (
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Manage Request</h3>
                  
                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4 text-sm">
                    <div>
                      <label className="block font-medium text-slate-700">Status</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as RequestStatus)}
                        className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 focus:border-slate-500 focus:outline-none"
                      >
                        {Object.values(RequestStatus).map((status) => (
                          <option key={status} value={status}>
                            {status.replace(/_/g, " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700">Admin Explanation (Visible to Partner)</label>
                      <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        rows={3}
                        placeholder="Explain scoping (e.g. why it's additional work) or provide a status update..."
                        className="mt-1 block w-full rounded-md border border-slate-300 py-2 px-3 focus:border-slate-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={cancelEditing}
                        disabled={isSaving}
                        className="rounded-md px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveChangeRequest(cr.id)}
                        disabled={isSaving}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Save Status"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {cr.explanation ? (
                    <div className="text-sm">
                      <p className="font-semibold text-slate-700">Explanation</p>
                      <p className="text-slate-600 mt-1">{cr.explanation}</p>
                    </div>
                  ) : (
                    <p className="text-sm italic text-slate-500">No explanation provided.</p>
                  )}
                  
                  <button
                    onClick={() => startEditing(cr)}
                    className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Update Status
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
