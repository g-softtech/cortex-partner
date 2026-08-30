import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const email = 'build@thecortexsystems.com';
  
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists.');
    return;
  }

  const password = 'TempPassword123!';
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const user = await prisma.user.create({
    data: {
      email,
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin created successfully in dev:', user.email);
}

run().catch(console.error).finally(() => prisma.$disconnect());
