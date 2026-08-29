import Link from "next/link";
import { ArrowLeft, FileDown, Presentation, FileText } from "lucide-react";

export default function SalesKitPage() {
  const assets = [
    {
      title: "Core Pitch Deck",
      description: "A 15-slide customizable presentation covering standard offerings.",
      icon: Presentation,
    },
    {
      title: "Client Case Studies",
      description: "Anonymized case studies showing ROI and success metrics.",
      icon: FileText,
    },
    {
      title: "Email Templates",
      description: "High-converting outbound sequences for prospecting.",
      icon: FileDown,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/resources" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Resources
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Sales Kit</h1>
        <p className="mt-2 text-base text-slate-500">
          Everything you need to successfully pitch and close deals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <div key={asset.title} className="relative flex flex-col items-center p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-center">
            <div className="p-3 bg-slate-50 text-slate-700 rounded-full mb-4">
              <asset.icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">{asset.title}</h3>
            <p className="mt-2 text-sm text-slate-500 mb-6">{asset.description}</p>
            <button className="mt-auto inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500">
              Download <FileDown className="ml-1 h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
