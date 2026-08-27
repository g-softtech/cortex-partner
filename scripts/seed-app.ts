import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.sequence.upsert({
    where: { id: "APPLICATION" },
    update: { value: { increment: 1 } },
    create: { id: "APPLICATION", value: 1 },
  });

  const app = await prisma.partnerApplication.create({
    data: {
      applicationNumber: 'CPA-TEST1',
      name: 'Test Partner',
      email: 'partner@test.com',
      phone: '1234567890',
      occupation: 'Developer',
      hasPotentialClients: true,
      potentialClientType: 'B2B',
      reason: 'Testing the flow',
      source: 'Google',
      status: 'PENDING',
    },
  });

  console.log(`Created test application: ${app.id}`);
}

main().finally(() => prisma.$disconnect());
