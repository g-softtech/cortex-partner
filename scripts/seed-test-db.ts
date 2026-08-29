import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // Upsert Admin
  const admin = await db.user.upsert({
    where: { email: 'admin@test.com' },
    update: { password, role: UserRole.ADMIN },
    create: {
      email: 'admin@test.com',
      name: 'Test Admin',
      password,
      role: UserRole.ADMIN,
    },
  });

  // Upsert Partner
  const partnerUser = await db.user.upsert({
    where: { email: 'partner@test.com' },
    update: { password, role: UserRole.PARTNER },
    create: {
      email: 'partner@test.com',
      name: 'Test Partner',
      password,
      role: UserRole.PARTNER,
    },
  });

  await db.partner.upsert({
    where: { userId: partnerUser.id },
    update: {},
    create: {
      userId: partnerUser.id,
      partnerId: 'CP-TEST-1',
    },
  });

  console.log('Test database seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
