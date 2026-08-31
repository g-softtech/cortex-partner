import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import NewSupportForm from "./NewSupportForm";

export const metadata = {
  title: "New Support Request | Cortex Partner Program",
};

export default async function NewSupportRequestPage() {
  const { partner } = await requirePartnerSession().catch(() => notFound());

  // Fetch the partner's active projects for the project selector
  const projects = await db.project.findMany({
    where: {
      partnerId: partner.id,
      projectStatus: {
        notIn: ["CANCELLED", "ARCHIVED", "LOST"],
      },
    },
    select: {
      id: true,
      projectNumber: true,
      projectType: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <NewSupportForm projects={projects} />;
}
