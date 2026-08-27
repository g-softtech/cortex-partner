import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

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
    <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden w-64 flex-col border-r bg-white lg:flex">
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="text-xl">Cortex Partner</span>
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Dashboard
          </Link>
          <Link
            href="/projects"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Projects
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Profile
          </Link>
        </nav>
        <div className="border-t p-4">
          <div className="mb-4 px-3">
            <p className="truncate text-sm font-medium text-slate-900">{session.user.name}</p>
            <p className="truncate text-xs text-slate-500">{session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 lg:hidden">
        <Link href="/dashboard" className="font-bold text-slate-900">
          Cortex Partner
        </Link>
        {/* Simple Mobile Navigation Links for now */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
            Home
          </Link>
          <Link href="/projects" className="text-slate-600 hover:text-slate-900">
            Projects
          </Link>
          <Link href="/profile" className="text-slate-600 hover:text-slate-900">
            Profile
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
