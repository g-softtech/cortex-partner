import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const u = await p.user.findUnique({
    where: { email: "admin@thecortexsystems.com" },
    select: { id: true, email: true, role: true, password: true },
  });

  console.log(
    "ADMIN USER:",
    JSON.stringify({
      id: u?.id,
      email: u?.email,
      role: u?.role,
      hasPassword: !!u?.password,
    })
  );

  const apps = await p.partnerApplication.findMany({
    select: { id: true, name: true, status: true, email: true },
  });
  console.log("APPLICATIONS:", JSON.stringify(apps));

  const tokens = await p.accountSetupToken.findMany({
    select: { id: true, userId: true, expiresAt: true, consumedAt: true },
  });
  console.log("TOKENS:", JSON.stringify(tokens));
}

main().finally(() => p.$disconnect());
