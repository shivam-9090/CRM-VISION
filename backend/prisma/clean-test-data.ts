import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean Test Data Script
 * Removes all test users and their associated data from the database
 * Only deletes users with email pattern: testuser{1-4}@crm.com
 */
async function cleanTestData() {
  const startTime = Date.now();

  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧹 CLEANING TEST DATA');
    console.log('='.repeat(60));

    // Find all test users
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'testuser1@crm.com',
            'testuser2@crm.com',
            'testuser3@crm.com',
            'testuser4@crm.com',
          ],
        },
      },
    });

    if (testUsers.length === 0) {
      console.log('✅ No test data found. Database is clean.');
      return;
    }

    console.log(`\n📋 Found ${testUsers.length} test users to clean up:`);
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name})`);
    });

    // Extract user IDs
    const testUserIds = testUsers.map((u) => u.id);

    console.log('\n🗑️  Deleting associated data...');

    // Get test user companies first
    const testCompanies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: 'Test Company' } },
          { description: { contains: 'test user' } },
        ],
      },
      select: { id: true },
    });

    const testCompanyIds = testCompanies.map((c) => c.id);

    // Delete in order due to foreign key constraints
    // 1. Delete Comments
    const deletedComments = await prisma.comment.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${deletedComments.count} comments`);

    // 2. Delete Notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${deletedNotifications.count} notifications`);

    // 3. Delete Attachments
    const deletedAttachments = await prisma.attachment.deleteMany({
      where: { uploadedBy: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${deletedAttachments.count} attachments`);

    // 4. Delete Audit Logs
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: { userId: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${deletedAuditLogs.count} audit logs`);

    // 5. Delete Activities (before deals)
    const deletedActivities = await prisma.activity.deleteMany({
      where: {
        OR: [
          { assignedToId: { in: testUserIds } },
          { companyId: { in: testCompanyIds } },
        ],
      },
    });
    console.log(`   ✓ Deleted ${deletedActivities.count} activities`);

    // 6. Delete Deals (before contacts and companies)
    const deletedDeals = await prisma.deal.deleteMany({
      where: {
        OR: [
          { assignedToId: { in: testUserIds } },
          { companyId: { in: testCompanyIds } },
        ],
      },
    });
    console.log(`   ✓ Deleted ${deletedDeals.count} deals`);

    // 7. Delete Contacts
    const deletedContacts = await prisma.contact.deleteMany({
      where: { companyId: { in: testCompanyIds } },
    });
    console.log(`   ✓ Deleted ${deletedContacts.count} contacts`);

    // 8. Delete Companies
    const deletedCompanies = await prisma.company.deleteMany({
      where: { id: { in: testCompanyIds } },
    });
    console.log(`   ✓ Deleted ${deletedCompanies.count} companies`);

    // 9. Delete Test Users
    const deletedUsers = await prisma.user.deleteMany({
      where: { id: { in: testUserIds } },
    });
    console.log(`   ✓ Deleted ${deletedUsers.count} test users`);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('✨ CLEANUP COMPLETE! ✨');
    console.log('='.repeat(60));
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log(
      `\n📊 Summary: Removed ${deletedUsers.count} test users and all associated data`,
    );
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute cleanup
cleanTestData()
  .then(() => {
    console.log('✅ Cleanup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
