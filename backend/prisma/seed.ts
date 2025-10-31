import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create test companies first
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Tech Solutions Inc.',
        description: 'Leading technology solutions provider',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Global Manufacturing Corp',
        description: 'International manufacturing company',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Healthcare Partners',
        description: 'Healthcare technology and services',
      },
    }),
  ]);

  console.log('🏢 Created companies:', companies.map(c => c.name));

  // Create admin user with first company
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@crm.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      companyId: companies[0].id,
    },
  });

  console.log('👤 Created admin user:', adminUser.email);

  // Create test contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@techsolutions.com',
        phone: '+1-555-0124',
        companyId: companies[0].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@globalmanufacturing.com',
        phone: '+1-555-0457',
        companyId: companies[1].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@healthcarepartners.com',
        phone: '+1-555-0790',
        companyId: companies[2].id,
      },
    }),
  ]);

  console.log('👥 Created contacts:', contacts.map(c => `${c.firstName} ${c.lastName}`));

  // Create test deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: 'Enterprise Software License',
        value: 85000,
        stage: 'NEGOTIATION',
        companyId: companies[0].id,
        contactId: contacts[0].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Manufacturing Equipment Deal',
        value: 250000,
        stage: 'PROPOSAL',
        companyId: companies[1].id,
        contactId: contacts[1].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Healthcare Consulting Services',
        value: 45000,
        stage: 'QUALIFIED',
        companyId: companies[2].id,
        contactId: contacts[2].id,
      },
    }),
  ]);

  console.log('💰 Created deals:', deals.map(d => d.title));

  // Create sample activities
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        title: 'Follow up call with John',
        type: 'CALL',
        status: 'SCHEDULED',
        scheduledDate: new Date('2024-12-10'),
        companyId: companies[0].id,
      },
    }),
    prisma.activity.create({
      data: {
        title: 'Prepare proposal presentation',
        type: 'TASK',
        status: 'SCHEDULED',
        scheduledDate: new Date('2024-12-08'),
        companyId: companies[1].id,
      },
    }),
  ]);

  console.log('📝 Created activities:', activities.map(a => a.title));

  console.log('✅ Seed completed successfully!');
  console.log('📋 Login credentials: admin@crm.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });