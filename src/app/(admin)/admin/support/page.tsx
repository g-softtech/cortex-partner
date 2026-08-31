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
  partner: {
    user: {
      name: string;
      email: string;
    };
  };
}

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/admin/support");
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Support Requests</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Manage support requests from all partners.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">No support requests</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">There are currently no support requests to review.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Partner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 dark:bg-slate-900/50 cursor-pointer" onClick={() => window.location.href = `/admin/support/${req.id}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    <Link href={`/admin/support/${req.id}`} className="hover:underline">
                      {req.supportNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                    <div>{req.partner.user.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{req.partner.user.email}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 truncate max-w-xs">{req.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{req.category.replace(/_/g, " ")}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      req.status === 'RESOLVED' || req.status === 'CLOSED'
                        ? 'bg-green-100 text-green-800'
                        : req.status === 'IN_PROGRESS'
                        ? 'bg-blue-100 text-blue-800'
                        : req.status === 'WAITING_ON_PARTNER'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}>
                      {req.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
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
