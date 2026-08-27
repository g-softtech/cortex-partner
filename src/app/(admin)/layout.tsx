import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth/session";
import Link from "next/link";

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
    <div className="min-h-screen bg-slate-100">
      {/* Admin Navigation */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight">Cortex Admin</span>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/admin/partner-applications"
              className="text-slate-300 hover:text-white transition-colors"
            >
              Applications
            </Link>
          </nav>
        </div>
        <span className="text-xs text-slate-400 uppercase tracking-widest">Admin Panel</span>
      </header>

      <main className="p-6">{children}</main>
    </div>
  );
}
