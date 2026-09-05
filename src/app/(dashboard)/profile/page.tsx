import { notFound } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ProfileEditForm } from "./ProfileEditForm";
import Link from "next/link";

export const metadata = {
  title: "Profile | Cortex Partner Program",
  description: "Your partner account details",
};

export default async function ProfilePage() {
  const { session, partner } = await requirePartnerSession().catch(() => notFound());

  // Fetch original application date (if linked)
  const application = partner.partnerApplicationId
    ? await db.partnerApplication.findUnique({
        where: { id: partner.partnerApplicationId },
        select: { createdAt: true, applicationNumber: true },
      })
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your partner account details.</p>
      </div>

      <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
        <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-slate-100">Account Information</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Partner ID
            </dt>
            <dd className="mt-1 font-mono font-bold text-slate-900 dark:text-slate-100">{partner.partnerId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Status
            </dt>
            <dd className="mt-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  partner.status === "ACTIVE"
                    ? "bg-green-100 text-green-800"
                    : partner.status === "SUSPENDED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {partner.status}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Full Name
            </dt>
            <ProfileEditForm currentName={session.user.name ?? ""} />
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Email Address
            </dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-100">{session.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Partner Since
            </dt>
            <dd className="mt-1 text-slate-900 dark:text-slate-100">
              {new Date(partner.joinedAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
            </dd>
          </div>
          {application && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Application Number
              </dt>
              <dd className="mt-1 font-mono text-slate-900 dark:text-slate-100">{application.applicationNumber}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg border bg-white dark:bg-slate-800 p-6">
        <h2 className="mb-5 text-base font-semibold text-slate-900 dark:text-slate-100">Security</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Password</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              If you need to change your password, you can request a password reset email.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="rounded-md bg-slate-100 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 text-center"
          >
            Change Password
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 text-sm text-slate-500 dark:text-slate-400">
        To update other account details, please contact Cortex support.
      </div>
    </div>
  );
}
