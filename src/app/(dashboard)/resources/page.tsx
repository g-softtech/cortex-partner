"use client";

import Link from "next/link";
import { BookOpen, Briefcase, Paintbrush } from "lucide-react";

export default function ResourcesPage() {
  const resources = [
    {
      title: "Partner Guide",
      description: "Everything you need to know about the Cortex Partner Program, your benefits, and how to succeed.",
      icon: BookOpen,
      href: "/resources/partner-guide",
      color: "bg-blue-50 text-blue-700",
    },
    {
      title: "Sales Kit",
      description: "Pitch decks, battle cards, and email templates to help you close more deals.",
      icon: Briefcase,
      href: "/resources/sales-kit",
      color: "bg-green-50 text-green-700",
    },
    {
      title: "White-label Guidelines",
      description: "Brand guidelines and instructions for white-labeling Cortex products for your clients.",
      icon: Paintbrush,
      href: "/resources/white-label",
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Partner Resources</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Access exclusive materials to help you build and sell with Cortex.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Link key={resource.title} href={resource.href} className="block group">
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md hover:border-slate-300 dark:border-slate-700">
              <div className="p-6">
                <div className={`inline-flex rounded-lg p-3 ${resource.color}`}>
                  <resource.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-slate-700 dark:text-slate-300">{resource.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{resource.description}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:text-slate-100">View Resource</span>
                <span className="text-slate-400 group-hover:text-slate-600 dark:text-slate-400">&rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
