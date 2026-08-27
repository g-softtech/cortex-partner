import { PrismaClient, UserRole } from '@prisma/client';
import readline from 'readline';
import { Writable } from 'stream';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function prompt(query: string, hidden: boolean = false): Promise<string> {
  return new Promise((resolve) => {
    const mutableStdout = new Writable({
      write(chunk, encoding, callback) {
        if (!(this as any).muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      },
    });

    (mutableStdout as any).muted = false;

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });

    rl.question(query, (answer) => {
      if (hidden) {
        console.log(); // Add a newline since enter was muted
      }
      rl.close();
      resolve(answer.trim());
    });

    if (hidden) {
      (mutableStdout as any).muted = true;
    }
  });
}

async function main() {
  console.log('--- Cortex Admin Bootstrap ---');
  const email = await prompt('Admin Email: ');
  
  if (!email || !email.includes('@')) {
    console.error('Invalid email.');
    process.exit(1);
  }

  const password = await prompt('Password: ', true);
  const confirmPassword = await prompt('Confirm Password: ', true);

  if (!password) {
    console.error('Password cannot be empty.');
    process.exit(1);
  }

  if (password !== confirmPassword) {
    console.error('Passwords do not match.');
    process.exit(1);
  }

  // Refuse to silently overwrite an existing account
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.error(`User with email ${email} already exists.`);
    process.exit(1);
  }

  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log('Creating admin user...');
  const user = await prisma.user.create({
    data: {
      email,
      name: 'System Admin',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log(`Successfully created ADMIN user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error('Error during bootstrap:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
