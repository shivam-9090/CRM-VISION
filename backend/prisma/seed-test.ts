import {
  PrismaClient,
  DealStage,
  LeadSource,
  Priority,
  ActivityType,
  ActivityStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Test data configuration
const USERS_COUNT = 4;
const DEALS_PER_USER = 1000;
const CONTACTS_PER_USER = 50;
const ACTIVITIES_PER_USER = 100;
const COMPANIES_PER_USER = 20;

// Helper function to generate random data
const getRandomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const getRandomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomDate = (start: Date, end: Date): Date => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

// Data generators
const dealTitles = [
  'Enterprise Software License',
  'Cloud Migration Project',
  'Digital Transformation',
  'IT Infrastructure Upgrade',
  'Cybersecurity Assessment',
  'Data Analytics Platform',
  'CRM Implementation',
  'ERP System Deployment',
  'Mobile App Development',
  'Website Redesign',
  'Marketing Automation',
  'Customer Support Platform',
  'E-commerce Solution',
  'Business Intelligence',
  'DevOps Consulting',
  'API Integration',
  'Database Optimization',
  'Network Security',
  'Disaster Recovery',
  'Compliance Audit',
  'Training Program',
  'Consulting Services',
  'Maintenance Contract',
  'Support Package',
];

const companyNames = [
  'Tech Solutions Inc.',
  'Digital Innovations Ltd.',
  'Cloud Services Corp.',
  'Data Systems LLC',
  'Enterprise Solutions',
  'Global Tech Partners',
  'Innovation Labs',
  'Smart Systems Inc.',
  'Future Tech Group',
  'Cyber Security Pros',
  'AI Innovations',
  'Blockchain Solutions',
  'IoT Systems Corp.',
  'Quantum Computing Ltd.',
  'Robotics Inc.',
  'Green Energy Tech',
  'HealthTech Solutions',
  'FinTech Innovations',
  'EdTech Systems',
  'RetailTech Corp.',
  'Manufacturing Solutions',
  'Logistics Tech',
  'AgriTech Systems',
  'Real Estate Tech',
];

const firstNames = [
  'James',
  'Mary',
  'John',
  'Patricia',
  'Robert',
  'Jennifer',
  'Michael',
  'Linda',
  'William',
  'Barbara',
  'David',
  'Elizabeth',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
  'Christopher',
  'Nancy',
  'Daniel',
  'Lisa',
  'Matthew',
  'Betty',
  'Anthony',
  'Margaret',
  'Mark',
  'Sandra',
  'Donald',
  'Ashley',
];

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
];

const activityTitles = [
  'Follow up call',
  'Schedule demo',
  'Send proposal',
  'Contract review',
  'Client meeting',
  'Product presentation',
  'Budget discussion',
  'Technical review',
  'Requirement gathering',
  'Status update',
  'Quarterly review',
  'Project kickoff',
  'Training session',
  'Team sync',
  'Stakeholder update',
  'Risk assessment',
];

const dealStages: DealStage[] = [
  'LEAD',
  'QUALIFIED',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
];
const leadSources: LeadSource[] = [
  'WEBSITE',
  'REFERRAL',
  'SOCIAL_MEDIA',
  'EMAIL_CAMPAIGN',
  'COLD_CALL',
  'LINKEDIN',
  'PARTNER',
  'TRADE_SHOW',
];
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const activityTypes: ActivityType[] = [
  'TASK',
  'CALL',
  'MEETING',
  'EMAIL',
  'NOTE',
];
const activityStatuses: ActivityStatus[] = [
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
];

async function main() {
  console.log('🚀 Starting test data seed...');
  console.log(
    `📊 Generating data for ${USERS_COUNT} users with ${DEALS_PER_USER} deals each`,
  );

  const startTime = Date.now();
  const hashedPassword = await bcrypt.hash('Test@123', 12);

  // Create test users with their companies
  for (let userIndex = 1; userIndex <= USERS_COUNT; userIndex++) {
    console.log(`\n👤 Creating User ${userIndex}/${USERS_COUNT}...`);

    // Create main company for user
    const mainCompany = await prisma.company.create({
      data: {
        name: `Test Company ${userIndex}`,
        description: `Primary company for test user ${userIndex}`,
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email: `testuser${userIndex}@crm.com`,
        password: hashedPassword,
        name: `Test User ${userIndex}`,
        phone: `+1-555-${String(userIndex).padStart(4, '0')}`,
        role: userIndex === 1 ? 'ADMIN' : 'EMPLOYEE',
        companyId: mainCompany.id,
        permissions:
          userIndex === 1
            ? ['*:*']
            : [
                'company:read',
                'company:create',
                'company:update',
                'contact:read',
                'contact:create',
                'contact:update',
                'deal:read',
                'deal:create',
                'deal:update',
                'activity:read',
                'activity:create',
                'activity:update',
              ],
      },
    });

    console.log(`✅ Created user: ${user.email}`);

    // Create additional companies
    console.log(`🏢 Creating ${COMPANIES_PER_USER} companies...`);
    const companies = [mainCompany];

    for (let i = 0; i < COMPANIES_PER_USER - 1; i++) {
      const company = await prisma.company.create({
        data: {
          name: `${getRandomElement(companyNames)} ${userIndex}-${i}`,
          description: `Test company for user ${userIndex}`,
        },
      });
      companies.push(company);
    }

    console.log(`✅ Created ${companies.length} companies`);

    // Create contacts
    console.log(`👥 Creating ${CONTACTS_PER_USER} contacts...`);
    const contacts: Array<{
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      companyId: string;
    }> = [];

    for (let i = 0; i < CONTACTS_PER_USER; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const company = getRandomElement(companies);

      const contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${userIndex}.${i}@test.com`,
          phone: `+1-555-${getRandomNumber(1000, 9999)}`,
          companyId: company.id,
        },
      });
      contacts.push(contact);
    }

    console.log(`✅ Created ${contacts.length} contacts`);

    // Create deals in batches (better performance)
    console.log(`💰 Creating ${DEALS_PER_USER} deals...`);
    const BATCH_SIZE = 100;
    let dealsCreated = 0;

    for (
      let batch = 0;
      batch < Math.ceil(DEALS_PER_USER / BATCH_SIZE);
      batch++
    ) {
      const dealPromises: Array<Promise<any>> = [];
      const batchSize = Math.min(BATCH_SIZE, DEALS_PER_USER - dealsCreated);

      for (let i = 0; i < batchSize; i++) {
        const company = getRandomElement(companies);
        const contact =
          getRandomElement(
            contacts.filter((c) => c.companyId === company.id),
          ) || getRandomElement(contacts);
        const stage = getRandomElement(dealStages);
        const value = getRandomNumber(5000, 500000);
        const leadScore = getRandomNumber(0, 100);

        const now = new Date();
        const pastDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
        const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days ahead

        dealPromises.push(
          prisma.deal.create({
            data: {
              title: `${getRandomElement(dealTitles)} - Deal ${dealsCreated + i + 1}`,
              value,
              stage,
              leadSource: getRandomElement(leadSources),
              leadScore,
              priority: getRandomElement(priorities),
              expectedCloseDate: getRandomDate(now, futureDate),
              companyId: company.id,
              contactId: contact.id,
              assignedToId: user.id,
              notes: `Test deal ${dealsCreated + i + 1} for user ${userIndex}`,
              createdAt: getRandomDate(pastDate, now),
            },
          }),
        );
      }

      await Promise.all(dealPromises);

      dealsCreated += batchSize;
      if ((batch + 1) % 5 === 0) {
        console.log(
          `   📈 Progress: ${dealsCreated}/${DEALS_PER_USER} deals created`,
        );
      }
    }

    console.log(`✅ Created ${dealsCreated} deals`);

    // Create activities
    console.log(`📅 Creating ${ACTIVITIES_PER_USER} activities...`);
    const activityPromises: Array<Promise<any>> = [];

    for (let i = 0; i < ACTIVITIES_PER_USER; i++) {
      const company = getRandomElement(companies);
      const contact =
        getRandomElement(contacts.filter((c) => c.companyId === company.id)) ||
        getRandomElement(contacts);

      const now = new Date();
      const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      activityPromises.push(
        prisma.activity.create({
          data: {
            title: `${getRandomElement(activityTitles)} - ${contact.firstName} ${contact.lastName}`,
            type: getRandomElement(activityTypes),
            status: getRandomElement(activityStatuses),
            scheduledDate: getRandomDate(pastDate, futureDate),
            description: `Test activity ${i + 1} for user ${userIndex}`,
            companyId: company.id,
            contactId: contact.id,
            assignedToId: user.id,
          },
        }),
      );
    }

    await Promise.all(activityPromises);

    console.log(`✅ Created ${ACTIVITIES_PER_USER} activities`);

    console.log(`\n🎉 Completed User ${userIndex} setup!`);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('✨ TEST DATA GENERATION COMPLETE! ✨');
  console.log('='.repeat(60));
  console.log(`⏱️  Total time: ${duration} seconds`);
  console.log(`\n📊 Summary:`);
  console.log(`   👥 Users created: ${USERS_COUNT}`);
  console.log(`   🏢 Companies per user: ${COMPANIES_PER_USER}`);
  console.log(`   👤 Contacts per user: ${CONTACTS_PER_USER}`);
  console.log(`   💰 Deals per user: ${DEALS_PER_USER}`);
  console.log(`   📅 Activities per user: ${ACTIVITIES_PER_USER}`);
  console.log(`\n   📈 Total records:`);
  console.log(`      - Users: ${USERS_COUNT}`);
  console.log(`      - Companies: ${USERS_COUNT * COMPANIES_PER_USER}`);
  console.log(`      - Contacts: ${USERS_COUNT * CONTACTS_PER_USER}`);
  console.log(`      - Deals: ${USERS_COUNT * DEALS_PER_USER}`);
  console.log(`      - Activities: ${USERS_COUNT * ACTIVITIES_PER_USER}`);

  console.log('\n🔑 Test Login Credentials:');
  for (let i = 1; i <= USERS_COUNT; i++) {
    console.log(
      `   ${i}. testuser${i}@crm.com / Test@123 ${i === 1 ? '(ADMIN)' : '(EMPLOYEE)'}`,
    );
  }
  console.log('\n💡 To remove test data, run: npm run seed:clean');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
