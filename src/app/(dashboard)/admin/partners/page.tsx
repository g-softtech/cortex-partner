import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PartnerManagementTable, PartnerItem } from "./PartnerManagementTable";

export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  await requireAdminSession();

  const rawPartners = await db.partner.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      partnerId: true,
      status: true,
      joinedAt: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          projects: true,
        },
      },
    },
  });

  const partners: PartnerItem[] = rawPartners.map((p) => ({
    id: p.id,
    partnerId: p.partnerId,
    status: p.status as "ACTIVE" | "SUSPENDED" | "INACTIVE",
    joinedAt: p.joinedAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
    user: {
      id: p.user.id,
      name: p.user.name,
      email: p.user.email,
    },
    _count: {
      projects: p._count.projects,
    },
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Partner Account Management
          </h1>
          <p className="text-sm text-muted-foreground">
            View, suspend, reactivate, or revoke approved partner portal accounts.
          </p>
        </div>
      </div>

      <PartnerManagementTable initialPartners={partners} />
    </div>
  );
}
