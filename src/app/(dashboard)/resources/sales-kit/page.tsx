import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Sales Kit | Cortex Partner Program",
  description: "Practical guidance for finding and discussing software opportunities.",
};

export default function SalesKitPage() {
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
          Partner Sales Kit
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">Version 1.0</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">

        {/* Purpose */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">Purpose</h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            The Sales Kit gives Partners practical guidance for finding and discussing software opportunities.
          </p>
        </section>

        {/* Who to Approach */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Who to Approach
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3">
            Partners can look for businesses and organizations that need:
          </p>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            {[
              "New websites",
              "Website redesigns",
              "Web applications",
              "Business management systems",
              "E-commerce systems",
              "Custom software",
              "Internal workflow tools",
              "Digital platforms",
              "Other suitable software solutions",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Simple Introduction */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Simple Introduction
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3">Suggested message:</p>
          <blockquote className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border-l-4 border-slate-300 dark:border-slate-600 pl-5 pr-4 py-4 text-slate-700 dark:text-slate-300 italic leading-relaxed text-sm">
            Hi, I work with a professional software development team that helps businesses build
            websites, web applications, business systems and custom digital solutions. If you have a
            process you&apos;d like to improve or a digital product you&apos;d like to build, I&apos;d
            be happy to discuss what you need.
          </blockquote>
        </section>

        {/* Discovery Questions */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Discovery Questions
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3">Ask the customer:</p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            {[
              "What are you trying to achieve?",
              "What problem are you currently experiencing?",
              "How do you currently handle this?",
              "What would you like the new system to do?",
              "Who will use it?",
              "What are the most important features?",
              "Do you have an existing website or system?",
              "Do you have a preferred timeline?",
              "Do you have a budget range?",
            ].map((q) => (
              <li key={q} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                {q}
              </li>
            ))}
          </ul>
        </section>

        {/* Before Promising Anything */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Before Promising Anything
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3">Do not promise:</p>
          <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
            {[
              "Features that have not been assessed",
              "Final delivery dates that have not been approved",
              "Prices that have not been agreed",
              "Unlimited revisions",
              "Services Cortex has not accepted",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Submit the opportunity to Cortex when enough information is available for assessment.
          </p>
        </section>

        {/* Important note */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-2">Important</p>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            The Sales Kit is guidance. The current approved project assessment and applicable project
            terms always control a specific project.
          </p>
        </div>

        {/* Core Message */}
        <div className="rounded-xl bg-slate-900 dark:bg-slate-700 p-6">
          <p className="text-xs uppercase tracking-widest font-semibold text-slate-400 mb-3">Core Message</p>
          <p className="text-slate-300 text-sm mb-4">You do not have to build the software yourself.</p>
          <p className="text-white font-semibold leading-relaxed">
            You find the opportunity.<br />
            Cortex handles the technical development.<br />
            You manage your customer relationship.<br />
            You deliver the solution.
          </p>
        </div>
      </div>
    </div>
  );
}
