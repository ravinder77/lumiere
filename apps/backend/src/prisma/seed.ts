import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lumiere.com' },
    update: {},
    create: {
      email: 'admin@lumiere.com',
      name: 'Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  // Demo customer
  const userHash = await bcrypt.hash('Demo1234!', 12);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@lumiere.com' },
    update: {},
    create: {
      email: 'demo@lumiere.com',
      name: 'Demo User',
      passwordHash: userHash,
      role: 'CUSTOMER',
    },
  });

  console.log(`✅ Admin:    ${admin.email}  (password: Admin123!)`);
  console.log(`✅ Customer: ${demo.email}  (password: Demo1234!)`);
  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
