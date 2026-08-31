"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface SupportRequest {
  id: string;
  supportNumber: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
}

export default function PartnerSupportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<SupportRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const res = await fetch(`/api/support`);
        if (res.ok) {
          const data = await res.json();
          const req = data.find((r: SupportRequest) => r.id === id);
          if (req) {
            setRequest(req);
          } else {
            router.push("/support");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/support"
          className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100"
        >
          &larr; Back to Support
        </Link>
      </div>

      <div className="overflow-hidden bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 sm:rounded-xl">
        <div className="border-b border-slate-200 dark:border-slate-700 px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-base font-semibold leading-6 text-slate-900 dark:text-slate-100">
              Support Request {request.supportNumber}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Submitted on {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${
              request.status === 'RESOLVED' || request.status === 'CLOSED'
                ? 'bg-green-100 text-green-800'
                : request.status === 'IN_PROGRESS'
                ? 'bg-blue-100 text-blue-800'
                : request.status === 'WAITING_ON_PARTNER'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}>
              {request.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Category</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100">{request.category.replace(/_/g, " ")}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Subject</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 font-medium">{request.subject}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Description</dt>
              <dd className="mt-1 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap rounded-md bg-slate-50 dark:bg-slate-900/50 p-4 ring-1 ring-inset ring-slate-200">
                {request.description}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
