import { requirePartnerSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { CURRENT_AGREEMENT_VERSION } from "@/lib/agreements/partner-agreement";
import { redirect, notFound } from "next/navigation";
import AgreementAcceptForm from "./AgreementAcceptForm";

export const metadata = {
  title: "Partner Agreement | Cortex Partner Program",
};

export const dynamic = "force-dynamic";

export default async function AgreementPage() {
  const { partner } = await requirePartnerSession().catch(() => notFound());

  // Check if already accepted
  const existingAcceptance = await db.partnerAgreementLog.findFirst({
    where: { partnerId: partner.id, version: CURRENT_AGREEMENT_VERSION },
    select: { acceptedAt: true },
  });

  // Already accepted — redirect to dashboard
  if (existingAcceptance) {
    redirect("/dashboard");
  }

  return <AgreementAcceptForm version={CURRENT_AGREEMENT_VERSION} />;
}
