import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import Link from "next/link";
import { NotificationDropdown } from "@/components/ui/NotificationDropdown";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Admin route group layout.
 * Enforces ADMIN session server-side before rendering any admin page.
 * Redirects to /login if not authenticated or not ADMIN.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminSession();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Admin Navigation */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight">Cortex <span className="text-brand-gold">Admin</span></span>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/admin/partner-applications"
              className="text-slate-600 dark:text-slate-400 hover:text-brand-gold transition-colors"
            >
              Applications
            </Link>
            <Link
              href="/admin/projects"
              className="text-slate-600 dark:text-slate-400 hover:text-brand-gold transition-colors"
            >
              Projects
            </Link>
            <Link
              href="/admin/support"
              className="text-slate-600 dark:text-slate-400 hover:text-brand-gold transition-colors"
            >
              Support
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <NotificationDropdown />
          <span className="text-xs text-brand-emerald uppercase tracking-widest hidden sm:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-emerald"></span>
            System: Online
          </span>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
