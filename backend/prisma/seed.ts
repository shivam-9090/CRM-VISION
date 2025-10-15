import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('password123', 12);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@crm.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('👤 Created admin user:', adminUser.email);

  // Create test companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Tech Solutions Inc.',
        industry: 'Technology',
        size: '100-500',
        website: 'https://techsolutions.com',
        email: 'info@techsolutions.com',
        phone: '+1-555-0123',
        address: '123 Tech Street, Silicon Valley, CA',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Global Manufacturing Corp',
        industry: 'Manufacturing',
        size: '1000+',
        website: 'https://globalmanufacturing.com',
        email: 'contact@globalmanufacturing.com',
        phone: '+1-555-0456',
        address: '456 Factory Lane, Detroit, MI',
      },
    }),
    prisma.company.create({
      data: {
        name: 'Healthcare Partners',
        industry: 'Healthcare',
        size: '50-100',
        website: 'https://healthcarepartners.com',
        email: 'info@healthcarepartners.com',
        phone: '+1-555-0789',
        address: '789 Medical Center Dr, Boston, MA',
      },
    }),
  ]);

  console.log('🏢 Created companies:', companies.map(c => c.name));

  // Create test contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@techsolutions.com',
        phone: '+1-555-0124',
        position: 'CTO',
        companyId: companies[0].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@globalmanufacturing.com',
        phone: '+1-555-0457',
        position: 'VP of Operations',
        companyId: companies[1].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@healthcarepartners.com',
        phone: '+1-555-0790',
        position: 'Director of IT',
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
        probability: 75,
        expectedCloseDate: new Date('2024-03-15'),
        description: 'Annual enterprise software license for 100 users',
        companyId: companies[0].id,
        contactId: contacts[0].id,
        ownerId: adminUser.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Manufacturing Equipment Deal',
        value: 250000,
        stage: 'PROPOSAL',
        probability: 60,
        expectedCloseDate: new Date('2024-04-30'),
        description: 'Custom manufacturing equipment and installation',
        companyId: companies[1].id,
        contactId: contacts[1].id,
        ownerId: adminUser.id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Healthcare Consulting Services',
        value: 45000,
        stage: 'QUALIFIED',
        probability: 40,
        expectedCloseDate: new Date('2024-05-15'),
        description: '6-month healthcare consulting engagement',
        companyId: companies[2].id,
        contactId: contacts[2].id,
        ownerId: adminUser.id,
      },
    }),
  ]);

  console.log('💰 Created deals:', deals.map(d => d.title));

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