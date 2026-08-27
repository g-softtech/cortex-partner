import { notFound } from "next/navigation";
import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

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
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your partner account details.</p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-5 text-base font-semibold text-slate-900">Account Information</h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Partner ID
            </dt>
            <dd className="mt-1 font-mono font-bold text-slate-900">{partner.partnerId}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
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
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Full Name
            </dt>
            <dd className="mt-1 text-slate-900">{session.user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Email Address
            </dt>
            <dd className="mt-1 text-slate-900">{session.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
              Partner Since
            </dt>
            <dd className="mt-1 text-slate-900">
              {new Date(partner.joinedAt).toLocaleDateString("en-GB", { dateStyle: "long" })}
            </dd>
          </div>
          {application && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-widest text-slate-500">
                Application Number
              </dt>
              <dd className="mt-1 font-mono text-slate-900">{application.applicationNumber}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        To update your account details, please contact Cortex support.
      </div>
    </div>
  );
}
