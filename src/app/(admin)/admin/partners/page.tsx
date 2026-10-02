import { requireAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PartnerManagementTable, PartnerItem } from "./PartnerManagementTable";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams?: { page?: string };
}

export default async function AdminPartnersPage({ searchParams }: PageProps) {
  await requireAdminSession();

  const PAGE_SIZE = 10;
  const pageParam = parseInt(searchParams?.page ?? "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const total = await db.partner.count();
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const safePage = totalPages > 0 && page > totalPages ? totalPages : page;
  const skip = (safePage - 1) * PAGE_SIZE;

  const rawPartners = await db.partner.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip,
    take: PAGE_SIZE,
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

  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + PAGE_SIZE, total);

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

      <PartnerManagementTable
        initialPartners={partners}
        pagination={{
          page: safePage,
          pageSize: PAGE_SIZE,
          total,
          totalPages,
          from,
          to,
        }}
      />
    </div>
  );
}
