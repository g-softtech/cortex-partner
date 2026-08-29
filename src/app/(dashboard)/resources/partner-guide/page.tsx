import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PartnerGuidePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/resources" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Resources
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Partner Guide</h1>
        <p className="mt-2 text-base text-slate-500">
          Everything you need to know about the Cortex Partner Program.
        </p>
      </div>

      <div className="prose prose-slate max-w-none bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2>Welcome to Cortex</h2>
        <p>
          As a Cortex Partner, you have access to a suite of enterprise-grade tools designed to help you deliver exceptional value to your clients while maximizing your own recurring revenue.
        </p>

        <h3>1. Submitting Projects</h3>
        <p>
          You can submit new client projects directly from the <strong>Projects</strong> tab in your dashboard. Once submitted, our team reviews the requirements and provides an assessment and pricing proposal within 48 hours.
        </p>

        <h3>2. The Kickoff Process</h3>
        <p>
          When you approve a proposal, you will be prompted to complete a Kickoff Form and upload any required client assets (logos, branding guidelines, API keys). Our team begins development immediately after the kickoff is approved.
        </p>

        <h3>3. Ongoing Support</h3>
        <p>
          If you encounter any issues or have questions, use the <strong>Support</strong> tab to open a ticket. Our dedicated partner success team will respond promptly.
        </p>

        <div className="mt-8 rounded-md bg-blue-50 p-4 border border-blue-200">
          <div className="flex">
            <div className="ml-3 flex-1 md:flex md:justify-between">
              <p className="text-sm text-blue-700">
                <strong>Need the PDF version?</strong> Download the full, comprehensive Partner Guide here.
              </p>
              <p className="mt-3 text-sm md:ml-6 md:mt-0">
                <a href="#" className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
                  Download PDF &rarr;
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
