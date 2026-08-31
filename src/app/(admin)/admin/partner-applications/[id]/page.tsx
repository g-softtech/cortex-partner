import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import ApplicationDetailClient from "./ApplicationDetailClient";

interface PageProps {
  params: { id: string };
}

export default async function ApplicationDetailPage({ params }: PageProps) {
  const application = await db.partnerApplication.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      applicationNumber: true,
      name: true,
      email: true,
      phone: true,
      occupation: true,
      hasPotentialClients: true,
      potentialClientType: true,
      reason: true,
      source: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      partner: {
        select: {
          partnerId: true,
          status: true,
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
        <Link href="/admin/partner-applications" className="hover:text-slate-900 dark:text-slate-100 transition-colors">
          Applications
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-700 dark:text-slate-300">{application.applicationNumber}</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{application.name}</h1>
        <span className="font-mono text-sm text-slate-500 dark:text-slate-400">{application.applicationNumber}</span>
      </div>

      <ApplicationDetailClient
        application={{
          ...application,
          createdAt: application.createdAt.toISOString(),
          updatedAt: application.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}
