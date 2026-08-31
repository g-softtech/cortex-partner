import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Partner Guide | Cortex Partner Program",
  description: "Everything you need to know about working as a Cortex Partner.",
};

export default function PartnerGuidePage() {
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
          Cortex Partner Guide
        </h1>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Version 1.0
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-8">

        {/* Welcome */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Welcome to the Cortex Partner Program
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Cortex provides the technical development capability behind your software opportunities.
          </p>
          <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed">
            You focus on finding opportunities, understanding your customer&apos;s needs, managing your
            customer relationship, and delivering the completed solution. Cortex handles the technical
            development behind the scenes.
          </p>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            How It Works
          </h2>
          <ol className="space-y-5">
            {[
              {
                n: "1",
                title: "Find an Opportunity",
                body: "Look for businesses that need websites, web applications, business systems, e-commerce solutions, custom software, digital platforms, or other approved digital solutions.",
              },
              {
                n: "2",
                title: "Submit the Opportunity",
                body: "Use the Partner Dashboard and select Submit Project. Give Cortex enough information to understand what the customer needs. You do not need to provide all customer branding, files, content, or technical credentials at this stage.",
              },
              {
                n: "3",
                title: "Cortex Assesses It",
                body: "Cortex reviews the opportunity and prepares the proposed solution, scope, Partner price, and estimated timeline.",
              },
              {
                n: "4",
                title: "Work With Your Customer",
                body: "Use the assessment to discuss the project with your customer. You remain responsible for the customer relationship.",
              },
              {
                n: "5",
                title: "Win the Project",
                body: "Once your customer agrees to proceed, update the project according to the platform workflow.",
              },
              {
                n: "6",
                title: "Complete Kickoff",
                body: "The platform will then request the detailed information Cortex needs: logo, colours, images, content, pages, features, integrations, domain information, design references, and other project materials.",
              },
              {
                n: "7",
                title: "Development",
                body: "Cortex develops the agreed solution.",
              },
              {
                n: "8",
                title: "Review",
                body: "When the project is ready, review it through the Partner Platform.",
              },
              {
                n: "9",
                title: "Changes",
                body: "If something needs to change, submit a Change Request. Do not simply send scattered change instructions through unrelated channels when the project workflow provides a Change Request.",
              },
              {
                n: "10",
                title: "Delivery",
                body: "When you are satisfied that the project is ready, use the Delivery Approval process. You then deliver the solution to your customer.",
              },
              {
                n: "11",
                title: "Support",
                body: "For technical issues or assistance, use the Support section.",
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center text-sm font-bold">
                  {step.n}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* What Not to Promise */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            What Not to Promise
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-3">Do not promise a customer:</p>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 text-sm">
            {[
              "An unapproved feature",
              "An unapproved timeline",
              "An unapproved price",
              "Unlimited revisions",
              "Services that Cortex has not agreed to provide",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            When unsure, ask Cortex before making a commitment.
          </p>
        </section>

        {/* Resources Note */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Resources
          </h2>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Use the Resources section for the Sales Kit, White-Label Guidelines, FAQ, and other approved
            Partner materials. Use project workflow pages for operational forms — do not look in Resources
            for project forms such as Kickoff or Change Requests; those appear when the project reaches
            the appropriate stage.
          </p>
        </section>

        {/* Principle */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-6">
          <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-semibold mb-2">
            Important Principle
          </p>
          <p className="text-slate-900 dark:text-slate-100 font-medium leading-relaxed">
            The Partner Program is designed to make you stronger commercially without requiring you to
            become a software developer.
          </p>
          <p className="mt-4 text-slate-700 dark:text-slate-300 font-semibold">
            You find the opportunity.<br />
            You manage the relationship.<br />
            Cortex builds the solution.<br />
            You deliver it.
          </p>
        </div>
      </div>
    </div>
  );
}
