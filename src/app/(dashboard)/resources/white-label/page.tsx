import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "White-Label Guidelines | Cortex Partner Program",
  description: "Guidelines for the behind-the-scenes relationship between Cortex and the Partner.",
};

export default function WhiteLabelPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link
        href="/resources"
        className="inline-flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Resources
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          White-Label / Delivery Guidelines
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">Version 1.0</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">

        {/* Purpose */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Purpose</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            These guidelines explain the intended behind-the-scenes relationship between Cortex and the Partner.
          </p>
        </section>

        {/* Relationship Structure */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Relationship Structure
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                role: "Customer",
                desc: "The Partner's customer deals primarily with the Partner.",
              },
              {
                role: "Partner",
                desc: "The Partner identifies the opportunity, manages the customer relationship, and delivers the completed solution.",
              },
              {
                role: "Cortex",
                desc: "Cortex provides the technical development capability behind the scenes.",
              },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4"
              >
                <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{r.role}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Normal Communication Flow */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Normal Communication Flow
          </h2>
          <div className="flex flex-col items-start gap-1 text-sm text-slate-700 dark:text-slate-300 font-medium mb-4">
            {["Customer", "↓", "Partner", "↓", "Cortex"].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">and, where appropriate:</p>
          <div className="flex flex-col items-start gap-1 text-sm text-slate-700 dark:text-slate-300 font-medium mb-3">
            {["Cortex", "↓", "Partner", "↓", "Customer"].map((item, i) => (
              <span key={i}>{item}</span>
            ))}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This structure helps the Partner maintain a consistent customer relationship.
          </p>
        </section>

        {/* Cortex Customer Contact */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Cortex Customer Contact
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
            Cortex should not unnecessarily bypass or interfere with the Partner&apos;s customer relationship.
          </p>
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            Direct customer communication may occur where reasonably necessary for:
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            {[
              "Technical clarification",
              "Security",
              "Project delivery",
              "Support",
              "Legal matters",
              "Payment matters",
              "Other circumstances agreed by the parties",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Partner Representation */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Partner Representation
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Partners must not falsely represent technical work, timelines, features, or commitments
            that Cortex has not approved.
          </p>
          <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
            Partners may explain their own customer-facing service arrangement while remaining accurate
            about the services being provided.
          </p>
        </section>

        {/* Brand Use */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Brand Use</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            The Partner must follow any applicable Cortex brand-use requirements.
          </p>
          <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
            The white-label relationship does not authorize a Partner to make false claims about Cortex
            or use Cortex&apos;s trademarks outside approved circumstances.
          </p>
        </section>

        {/* Project Delivery */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Project Delivery
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            The Partner remains the primary customer-facing delivery point unless a specific project
            arrangement states otherwise.
          </p>
        </section>

        {/* Principle */}
        <div className="rounded-xl bg-slate-900 dark:bg-slate-700 p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Principle</p>
          <p className="text-white font-semibold leading-relaxed">
            Partner owns the customer relationship.<br />
            Cortex powers the technical delivery behind the scenes.
          </p>
        </div>
      </div>
    </div>
  );
}
