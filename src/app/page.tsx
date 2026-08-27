import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl tracking-tighter">Cortex Partner</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#how-it-works">
            How it Works
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#benefits">
            Benefits
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-slate-50">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  YOU FIND THE OPPORTUNITY.<br/>WE BUILD THE SOLUTION.<br/>YOU DELIVER IT.
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 mt-4">
                  Join the Cortex Partner Program. Offer world-class web, mobile, and custom software solutions to your clients without hiring a development team.
                </p>
              </div>
              <div className="space-x-4 mt-6">
                <Link
                  href="/apply"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-slate-900 px-8 text-sm font-medium text-slate-50 shadow transition-colors hover:bg-slate-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50"
                >
                  BECOME A CORTEX PARTNER
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">How It Works</h2>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-bold text-xl mb-2">1</div>
                <h3 className="text-xl font-bold">Find Clients</h3>
                <p className="text-gray-500">You identify businesses that need digital solutions. You maintain the client relationship.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-bold text-xl mb-2">2</div>
                <h3 className="text-xl font-bold">We Build</h3>
                <p className="text-gray-500">Submit the project to us. We handle the technical scoping, design, and development.</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-bold text-xl mb-2">3</div>
                <h3 className="text-xl font-bold">You Profit</h3>
                <p className="text-gray-500">We give you a fixed partner price. You charge the client your retail price and keep the margin.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full py-12 md:py-24 lg:py-32 bg-slate-50">
          <div className="container px-4 md:px-6 max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">Program Benefits</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold mb-2">Zero Technical Overhead</h3>
                <p className="text-gray-500">Focus entirely on sales and relationships. We provide the engineering power.</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold mb-2">White-label Delivery</h3>
                <p className="text-gray-500">Our team operates behind the scenes. To your clients, it&apos;s your agency delivering the work.</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold mb-2">Predictable Pricing</h3>
                <p className="text-gray-500">Clear project scoping and fixed wholesale pricing so you know exactly what your margin will be.</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h3 className="text-lg font-bold mb-2">Dedicated Support</h3>
                <p className="text-gray-500">Access to a partner dashboard to track projects, manage change requests, and get fast support.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 w-full shrink-0 border-t flex flex-col sm:flex-row items-center px-4 md:px-6">
        <p className="text-xs text-gray-500">© 2026 Cortex Systems. All rights reserved.</p>
      </footer>
    </div>
  );
}
