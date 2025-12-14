import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed (minimal setup)...');

  // Create default company
  const company = await prisma.company.create({
    data: {
      name: 'Default Company',
      description: 'Your CRM Company',
    },
  });

  console.log('🏢 Created company:', company.name);

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@crm.com',
      password: hashedPassword,
      plainPassword: 'admin123',
      name: 'Admin User',
      role: 'ADMIN',
      companyId: company.id,
      isVerified: true,
      permissions: ['*:*'],
    },
  });

  console.log(
    '👤 Created admin user:',
    adminUser.email,
    '| Password: admin123',
  );

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12);
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@crm.com',
      password: managerPassword,
      plainPassword: 'manager123',
      name: 'Manager User',
      role: 'MANAGER',
      companyId: company.id,
      isVerified: true,
    },
  });

  console.log(
    '👤 Created manager user:',
    managerUser.email,
    '| Password: manager123',
  );

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
