import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from scripts/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const prisma = new PrismaClient();

interface TrainingData {
  deals: any[];
  wonDeals: any[];
  lostDeals: any[];
  contacts: any[];
  activities: any[];
  emailActivities: any[];
  companies: any[];
  statistics: {
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    activeDeals: number;
    totalContacts: number;
    totalActivities: number;
    emailActivities: number;
    totalCompanies: number;
  };
}

async function exportTrainingData() {
  console.log('📊 Exporting CRM data for AI training...\n');

  try {
    // 1. Export WON deals with all relationships
    console.log('1️⃣  Fetching WON deals...');
    const wonDeals = await prisma.deal.findMany({
      where: {
        stage: 'CLOSED_WON',
      },
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        company: {
          select: {
            name: true,
            description: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        activities: {
          select: {
            title: true,
            type: true,
            status: true,
            description: true,
            scheduledDate: true,
            createdAt: true,
          },
          orderBy: {
            scheduledDate: 'asc',
          },
        },
      },
      orderBy: {
        closedAt: 'desc',
      },
    });

    // 2. Export LOST deals for comparison
    console.log('2️⃣  Fetching LOST deals...');
    const lostDeals = await prisma.deal.findMany({
      where: {
        stage: 'CLOSED_LOST',
      },
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        company: {
          select: {
            name: true,
            description: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        activities: {
          select: {
            title: true,
            type: true,
            status: true,
            description: true,
            scheduledDate: true,
            createdAt: true,
          },
          orderBy: {
            scheduledDate: 'asc',
          },
        },
      },
      orderBy: {
        closedAt: 'desc',
      },
      take: wonDeals.length || 100, // Balance the dataset
    });

    // 3. Export active deals (for prediction training)
    console.log('3️⃣  Fetching active deals...');
    const activeDeals = await prisma.deal.findMany({
      where: {
        stage: {
          notIn: ['CLOSED_WON', 'CLOSED_LOST'],
        },
      },
      include: {
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        company: {
          select: {
            name: true,
            description: true,
          },
        },
        assignedTo: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        activities: {
          select: {
            title: true,
            type: true,
            status: true,
            description: true,
            scheduledDate: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // 4. Export email activities (for email generation training)
    console.log('4️⃣  Fetching email activities...');
    const emailActivities = await prisma.activity.findMany({
      where: {
        type: 'EMAIL',
        status: 'COMPLETED',
        description: {
          not: null,
        },
      },
      include: {
        deal: {
          select: {
            title: true,
            stage: true,
            value: true,
          },
        },
        contact: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
      take: 200, // Get latest 200 emails
    });

    // 5. Export all activities (for pattern analysis)
    console.log('5️⃣  Fetching all completed activities...');
    const allActivities = await prisma.activity.findMany({
      where: {
        status: 'COMPLETED',
      },
      include: {
        deal: {
          select: {
            title: true,
            stage: true,
            value: true,
          },
        },
        contact: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'desc',
      },
      take: 500,
    });

    // 6. Export contacts with engagement metrics
    console.log('6️⃣  Fetching contacts...');
    const contacts = await prisma.contact.findMany({
      include: {
        company: {
          select: {
            name: true,
            description: true,
          },
        },
        deals: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            status: true,
          },
        },
      },
      take: 1000,
    });

    // 7. Export companies
    console.log('7️⃣  Fetching companies...');
    const companies = await prisma.company.findMany({
      include: {
        deals: {
          select: {
            id: true,
            stage: true,
            value: true,
          },
        },
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Combine all deals
    const allDeals = [...wonDeals, ...lostDeals, ...activeDeals];

    // Prepare training data structure
    const trainingData: TrainingData = {
      deals: allDeals,
      wonDeals: wonDeals,
      lostDeals: lostDeals,
      contacts: contacts,
      activities: allActivities,
      emailActivities: emailActivities,
      companies: companies,
      statistics: {
        totalDeals: allDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        activeDeals: activeDeals.length,
        totalContacts: contacts.length,
        totalActivities: allActivities.length,
        emailActivities: emailActivities.length,
        totalCompanies: companies.length,
      },
    };

    // Save to JSON file
    const outputPath = path.join(__dirname, '../data/ai-training-data.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(trainingData, null, 2));

    // Print statistics
    console.log('\n✅ Export Complete!\n');
    console.log('📈 Statistics:');
    console.log('─────────────────────────────────────');
    console.log(`✓ Total Deals:        ${trainingData.statistics.totalDeals}`);
    console.log(`  ├─ Won Deals:       ${trainingData.statistics.wonDeals}`);
    console.log(`  ├─ Lost Deals:      ${trainingData.statistics.lostDeals}`);
    console.log(`  └─ Active Deals:    ${trainingData.statistics.activeDeals}`);
    console.log(`✓ Total Contacts:     ${trainingData.statistics.totalContacts}`);
    console.log(`✓ Total Activities:   ${trainingData.statistics.totalActivities}`);
    console.log(`  └─ Email Activities: ${trainingData.statistics.emailActivities}`);
    console.log(`✓ Total Companies:    ${trainingData.statistics.totalCompanies}`);
    console.log('─────────────────────────────────────');
    console.log(`📁 Data saved to: ${outputPath}\n`);

    // Data quality assessment
    console.log('📊 Data Quality Assessment:');
    console.log('─────────────────────────────────────');
    
    const minDealsRequired = 100;
    const minEmailsRequired = 30;
    const hasEnoughDeals = trainingData.statistics.totalDeals >= minDealsRequired;
    const hasEnoughEmails = trainingData.statistics.emailActivities >= minEmailsRequired;
    const hasBalancedDataset = Math.abs(wonDeals.length - lostDeals.length) < 30;

    console.log(`${hasEnoughDeals ? '✅' : '❌'} Total Deals: ${trainingData.statistics.totalDeals} (min: ${minDealsRequired})`);
    console.log(`${hasBalancedDataset ? '✅' : '⚠️ '} Dataset Balance: WON(${wonDeals.length}) vs LOST(${lostDeals.length})`);
    console.log(`${hasEnoughEmails ? '✅' : '❌'} Email Activities: ${trainingData.statistics.emailActivities} (min: ${minEmailsRequired})`);

    if (hasEnoughDeals && hasEnoughEmails) {
      console.log('\n✅ Your data is ready for AI fine-tuning!');
      console.log('📌 Next step: Run format-training-data.ts\n');
    } else {
      console.log('\n⚠️  Warning: You may need more data for optimal results.');
      if (!hasEnoughDeals) {
        console.log(`   - Need ${minDealsRequired - trainingData.statistics.totalDeals} more deals with outcomes`);
      }
      if (!hasEnoughEmails) {
        console.log(`   - Need ${minEmailsRequired - trainingData.statistics.emailActivities} more completed email activities`);
      }
      console.log('   - You can still proceed, but accuracy may be limited.\n');
    }

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the export
exportTrainingData().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
