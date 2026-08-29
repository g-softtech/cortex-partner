"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SupportRequest {
  id: string;
  supportNumber: string;
  category: string;
  subject: string;
  status: string;
  createdAt: string;
}

export default function PartnerSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/support");
        if (res.ok) {
          const data = await res.json();
          setRequests(data);
        }
      } catch (err) {
        console.error("Failed to load support requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Support</h1>
          <p className="mt-2 text-sm text-slate-500">View and manage your support requests.</p>
        </div>
        <Link
          href="/support/new"
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          New Request
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No support requests</h3>
          <p className="mt-1 text-sm text-slate-500">You haven&apos;t submitted any support requests yet.</p>
          <div className="mt-6">
            <Link
              href="/support/new"
              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
            >
              Submit Support Request
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => window.location.href = `/support/${req.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    <Link href={`/support/${req.id}`} className="hover:underline">
                      {req.supportNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 truncate max-w-xs">{req.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.category.replace(/_/g, " ")}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      req.status === 'RESOLVED' || req.status === 'CLOSED'
                        ? 'bg-green-100 text-green-800'
                        : req.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : req.status === 'WAITING_ON_PARTNER'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
