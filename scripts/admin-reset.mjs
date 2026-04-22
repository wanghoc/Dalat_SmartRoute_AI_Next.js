import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env' });
loadDotenv({ path: '.env.local', override: true });

const prisma = new PrismaClient();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

async function main() {
  const email = requireEnv('ADMIN_EMAIL');
  const username = (process.env.ADMIN_USERNAME || 'Admin').trim();
  const password = requireEnv('ADMIN_PASSWORD');

  const passwordHash = await bcrypt.hash(password, 10);

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  if (existingByEmail) {
    const updated = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        username,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`[admin-reset] Updated existing user id=${updated.id} email=${updated.email}`);
    return;
  }

  const existingByUsername = await prisma.user.findUnique({ where: { username } });
  if (existingByUsername) {
    const updated = await prisma.user.update({
      where: { id: existingByUsername.id },
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`[admin-reset] Updated existing user id=${updated.id} username=${updated.username}`);
    return;
  }

  const created = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role: 'ADMIN',
      avatar: null,
    },
  });
  console.log(`[admin-reset] Created admin user id=${created.id} email=${created.email}`);
}

main()
  .catch((err) => {
    console.error('[admin-reset] Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

