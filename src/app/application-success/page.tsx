import Link from "next/link";

export default function ApplicationSuccessPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900/50">
      <header className="px-4 lg:px-6 h-14 flex items-center bg-white dark:bg-slate-800 border-b">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl tracking-tighter">Cortex Partner</span>
        </Link>
      </header>

      <main className="flex-1 container px-4 md:px-6 max-w-2xl mx-auto py-24 text-center">
        <div className="bg-white dark:bg-slate-800 p-12 rounded-lg shadow-sm border space-y-6 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Application Received</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Thank you for applying to the Cortex Partner Program. We have received your application and our team will review it shortly.
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-md border text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            You can expect to hear from us via email within the next 48 hours.
          </div>
          <div className="pt-6">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-8 text-sm font-medium shadow-sm hover:bg-slate-50 dark:bg-slate-900/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
