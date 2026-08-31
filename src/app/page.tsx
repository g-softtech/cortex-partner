import Link from "next/link";
import { ArrowRight, Globe, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="px-6 lg:px-12 h-20 flex items-center border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <Link className="flex items-center justify-center gap-2" href="/">
          <div className="w-8 h-8 rounded bg-brand-gold flex items-center justify-center shadow-lg shadow-brand-gold/20">
            <Globe className="w-5 h-5 text-brand-navy" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-foreground">
            Cortex <span className="text-brand-gold">Partner</span>
          </span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-8 items-center">
          <Link className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#how-it-works">
            How it Works
          </Link>
          <Link className="hidden sm:inline-block text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#benefits">
            Benefits
          </Link>
          <ThemeToggle />
          <Link 
            className="text-sm font-bold text-brand-navy bg-brand-gold px-4 py-2 rounded-full hover:bg-yellow-400 transition-colors shadow-md" 
            href="/login"
          >
            Sign In
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative w-full py-20 md:py-32 lg:py-48 overflow-hidden bg-brand-navy">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#eab30810_1px,transparent_1px),linear-gradient(to_bottom,#eab30810_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          <div className="container relative px-4 md:px-6 max-w-6xl mx-auto z-10">
            <div className="flex flex-col items-center space-y-8 text-center">
              <div className="inline-flex items-center rounded-full border border-brand-gold/30 bg-brand-gold/10 px-3 py-1 text-sm font-medium text-brand-gold mb-4 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-brand-gold mr-2 animate-pulse"></span>
                The new Cortex Partner Program is live
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl/none text-white max-w-4xl mx-auto">
                  YOU FIND THE OPPORTUNITY.<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold to-yellow-200">
                    WE BUILD THE SOLUTION.
                  </span>
                  <br />
                  YOU DELIVER IT.
                </h1>
                <p className="mx-auto max-w-[750px] text-slate-300 md:text-xl/relaxed lg:text-2xl/relaxed font-medium mt-6">
                  Join the Cortex Partner Program. Offer world-class web, mobile, and custom software solutions to your clients without hiring a development team.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link
                  href="/apply"
                  className="inline-flex h-14 items-center justify-center rounded-full bg-brand-gold px-10 text-base font-bold text-brand-navy shadow-lg shadow-brand-gold/25 transition-all hover:scale-105 hover:bg-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                >
                  BECOME A PARTNER
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="w-full py-24 bg-background">
          <div className="container px-4 md:px-6 max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">How It Works</h2>
              <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl mx-auto">A seamless collaboration model designed to maximize your margins and minimize your technical headaches.</p>
            </div>
            
            <div className="grid gap-12 lg:grid-cols-3 relative">
              {/* Connecting line for desktop */}
              <div className="hidden lg:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-border -z-10"></div>
              
              <div className="flex flex-col items-center text-center space-y-4 relative bg-background">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-card border-2 border-brand-gold shadow-xl text-brand-gold font-black text-3xl mb-4">1</div>
                <h3 className="text-2xl font-bold text-foreground">Find Clients</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">You identify businesses that need digital solutions. You maintain the client relationship and handle the sales process.</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 relative bg-background">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-navy border-2 border-brand-navy shadow-xl text-white font-black text-3xl mb-4">2</div>
                <h3 className="text-2xl font-bold text-foreground">We Build</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">Submit the project to us. Our expert engineering team handles the technical scoping, design, and full-stack development.</p>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 relative bg-background">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-emerald border-2 border-brand-emerald shadow-xl text-white font-black text-3xl mb-4">3</div>
                <h3 className="text-2xl font-bold text-foreground">You Profit</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">We give you a fixed partner wholesale price. You charge the client your retail price, deliver the project, and keep the margin.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="w-full py-24 bg-card border-y border-border relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 rounded-full bg-brand-gold/5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 rounded-full bg-brand-emerald/5 blur-3xl"></div>
          
          <div className="container px-4 md:px-6 max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-foreground">Program Benefits</h2>
              <p className="mt-4 text-muted-foreground md:text-lg max-w-2xl mx-auto">Everything you need to scale your agency without scaling your payroll.</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
              <div className="group p-8 bg-background rounded-2xl shadow-sm border border-border hover:border-brand-gold/50 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-7 h-7 text-brand-gold" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Zero Technical Overhead</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">Focus entirely on sales, marketing, and client relationships. We provide the enterprise-grade engineering power behind the scenes.</p>
              </div>
              
              <div className="group p-8 bg-background rounded-2xl shadow-sm border border-border hover:border-brand-gold/50 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-7 h-7 text-brand-gold" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">White-label Delivery</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">Our team operates strictly behind the scenes. To your clients, it&apos;s your agency delivering the high-quality work.</p>
              </div>
              
              <div className="group p-8 bg-background rounded-2xl shadow-sm border border-border hover:border-brand-gold/50 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Globe className="w-7 h-7 text-brand-gold" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Predictable Pricing</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">Clear project scoping and fixed wholesale pricing so you know exactly what your margin will be before you pitch to the client.</p>
              </div>
              
              <div className="group p-8 bg-background rounded-2xl shadow-sm border border-border hover:border-brand-gold/50 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 bg-brand-navy/5 dark:bg-brand-navy/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-7 h-7 text-brand-gold" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-foreground">Dedicated Support</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">Access to a comprehensive partner dashboard to track active projects, manage change requests, and get priority support.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10 bg-background w-full shrink-0 border-t border-border">
        <div className="container max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-brand-gold" />
            <span className="font-bold text-lg text-foreground">Cortex Partner</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Cortex Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
