import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";
import { NotificationDropdown } from "@/components/ui/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Basic sanity check, middleware handles the strict check
  if (!session || session.user.role !== UserRole.PARTNER) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b border-slate-200 dark:border-slate-800 px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-foreground">
            <span className="text-xl">Cortex <span className="text-brand-gold">Partner</span></span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/projects"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
          >
            Projects
          </Link>
          <Link
            href="/support"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
          >
            Support
          </Link>
          <Link
            href="/resources"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
          >
            Resources
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground transition-colors"
          >
            Profile
          </Link>
        </nav>
        <div className="border-t border-slate-200 dark:border-slate-800 p-4">
          <div className="mb-4 px-3 flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="truncate text-sm font-bold text-foreground flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-emerald"></span>
                {session.user.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{session.user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <NotificationDropdown />
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-4 lg:hidden">
        <Link href="/dashboard" className="font-bold text-foreground">
          Cortex <span className="text-brand-gold">Partner</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationDropdown />
          {/* Simple Mobile Navigation Links for now */}
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100">
              Home
            </Link>
            <Link href="/projects" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100">
              Projects
            </Link>
            <Link href="/support" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100">
              Support
            </Link>
            <Link href="/resources" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100">
              Resources
            </Link>
            <Link href="/profile" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
