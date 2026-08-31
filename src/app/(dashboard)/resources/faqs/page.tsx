import Link from "next/link";

export const metadata = {
  title: "Partner FAQs | Cortex Partner Program",
  description: "Frequently asked questions about the Cortex Partner Program.",
};

// Source: docs/partner-program/14-PARTNER-FAQ.md (Version 1.0)
// Questions and answers are drawn directly from the approved source document.
const FAQS = [
  {
    q: "Do I need to know how to code?",
    a: "No. The Partner's primary role is to identify opportunities, work with customers, and manage the customer relationship. Cortex handles the technical development.",
  },
  {
    q: "Do I need to have customers already?",
    a: "Not necessarily. However, the ability to identify businesses with genuine software needs is important to succeeding as a Partner.",
  },
  {
    q: "Who finds the customer?",
    a: "The Partner finds and develops the customer opportunity.",
  },
  {
    q: "Who builds the software?",
    a: "Cortex handles the agreed technical development.",
  },
  {
    q: "Who talks to the customer?",
    a: "The Partner normally manages the customer relationship. Cortex may communicate directly when reasonably necessary for technical, security, support, legal, payment, or other agreed reasons.",
  },
  {
    q: "When do I submit a project?",
    a: "When you have identified a genuine software or digital-solution opportunity that is suitable for assessment.",
  },
  {
    q: "Do I need the customer's full details when I first submit an opportunity?",
    a: "No. The initial Project Opportunity submission is for assessment. Detailed development information is collected later if the project is won.",
  },
  {
    q: "When do I provide the logo, colours and pictures?",
    a: "During Project Kickoff, after the project has been won.",
  },
  {
    q: "What happens after I submit a project?",
    a: "Cortex reviews the opportunity and may provide a Project Assessment/Proposal containing the proposed solution, scope, Partner price and estimated timeline.",
  },
  {
    q: "Does submitting a project guarantee Cortex will build it?",
    a: "No. Each project is separately assessed and accepted.",
  },
  {
    q: "What happens if my customer asks for something outside the original scope?",
    a: "Submit a Change Request where appropriate. Cortex will assess whether the request is within scope or requires additional work.",
  },
  {
    q: "How do I get technical support?",
    a: "Use the Support section of the Partner Platform.",
  },
  {
    q: "Can I earn money from projects?",
    a: "The Partner may earn a commercial margin according to the applicable project arrangement. The program does not guarantee customers, projects, revenue, or earnings.",
  },
  {
    q: "Do I have to tell my customer about Cortex?",
    a: "The intended relationship is behind-the-scenes/white-label technical development. Follow the Partner Agreement and applicable project terms regarding representation and disclosure.",
  },
  {
    q: "Where are the forms?",
    a: "Operational forms appear inside the relevant workflow. Resources contain reusable materials such as the Partner Guide, Sales Kit, White-Label Guidelines and FAQ.",
  },
  {
    q: "What is the basic model?",
    a: "You find the opportunity. You manage the customer relationship. Cortex builds the solution. You deliver it.",
  },
];

export default function FAQsPage() {
  return (
    <div className="space-y-8">
      {/* Back */}
      <div>
        <Link
          href="/resources"
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          ← Back to Resources
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Version 1.0 — Cortex Partner Program
        </p>
      </div>

      {/* FAQ List */}
      <dl className="space-y-4">
        {FAQS.map((item) => (
          <div
            key={item.q}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5"
          >
            <dt className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {item.q}
            </dt>
            <dd className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {item.a}
            </dd>
          </div>
        ))}
      </dl>

      {/* Footer CTA */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">
            Still have a question?
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Open a support ticket and our team will help you.
          </p>
        </div>
        <Link
          href="/support/new"
          className="shrink-0 rounded-md bg-slate-900 dark:bg-slate-100 px-5 py-2 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors"
        >
          Open Support Request
        </Link>
      </div>
    </div>
  );
}
