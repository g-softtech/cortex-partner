import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WhiteLabelPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/resources" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Resources
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">White-label Guidelines</h1>
        <p className="mt-2 text-base text-slate-500">
          How to brand Cortex services as your own.
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="prose prose-slate max-w-none">
          <h2>Brand Protection</h2>
          <p>
            When delivering projects built by Cortex to your clients, you are permitted to fully white-label the deliverables. This means you can strip all Cortex branding, metadata, and references.
          </p>

          <h3>Allowed Actions</h3>
          <ul>
            <li>Applying your own logo to client portals we build.</li>
            <li>Invoicing your clients directly under your business name.</li>
            <li>Presenting our architecture as your own technical strategy.</li>
          </ul>

          <h3>Restrictions</h3>
          <ul>
            <li>You may not falsely claim ownership of our proprietary internal tools.</li>
            <li>You may not resell access to the Cortex Partner dashboard itself.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
