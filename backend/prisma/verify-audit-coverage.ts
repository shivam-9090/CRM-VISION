#!/usr/bin/env ts-node

/**
 * Audit Log Coverage Verification Script
 * 
 * This script verifies which entities are being audited in the CRM system.
 * Run this after applying @AuditLog decorators to ensure complete coverage.
 * 
 * Usage:
 *   ts-node verify-audit-coverage.ts
 * 
 * Or add to package.json scripts:
 *   "verify:audit": "ts-node prisma/verify-audit-coverage.ts"
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAuditCoverage() {
  console.log('📊 Audit Log Coverage Verification\n');
  console.log('='.repeat(60));

  try {
    // Get unique entity types from audit logs
    const entityTypes = await prisma.auditLog.groupBy({
      by: ['entityType'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get action breakdown
    const actionStats = await prisma.auditLog.groupBy({
      by: ['action'],
      _count: {
        id: true,
      },
    });

    // Expected entities that should be audited
    const expectedEntities = [
      'User',
      'Company',
      'Deal',
      'Contact',
      'Activity',
      'Comment',
      'Attachment',
    ];

    // Display coverage
    console.log('\n✅ AUDITED ENTITIES:\n');
    if (entityTypes.length === 0) {
      console.log('⚠️  No audit logs found. Have you applied @AuditLog decorators?');
    } else {
      entityTypes.forEach(({ entityType, _count }) => {
        console.log(`   ${entityType.padEnd(20)} ${_count.id.toString().padStart(6)} logs`);
      });
    }

    // Display action breakdown
    console.log('\n📈 ACTION BREAKDOWN:\n');
    actionStats.forEach(({ action, _count }) => {
      console.log(`   ${action.padEnd(10)} ${_count.id.toString().padStart(6)} logs`);
    });

    // Check for missing coverage
    const covered = entityTypes.map((e) => e.entityType);
    const missing = expectedEntities.filter((e) => !covered.includes(e));

    if (missing.length > 0) {
      console.log('\n⚠️  MISSING COVERAGE:\n');
      missing.forEach((entity) => {
        console.log(`   ❌ ${entity}`);
      });
      console.log('\n💡 Action Required:');
      console.log('   Apply @AuditLog decorators to service methods for the above entities.');
    } else {
      console.log('\n✅ ALL CRITICAL ENTITIES ARE COVERED!');
    }

    // Check date range
    const oldest = await prisma.auditLog.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const newest = await prisma.auditLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (oldest && newest) {
      console.log('\n📅 DATE RANGE:\n');
      console.log(`   Oldest: ${oldest.createdAt.toISOString()}`);
      console.log(`   Newest: ${newest.createdAt.toISOString()}`);
      
      const daysDiff = Math.floor(
        (newest.createdAt.getTime() - oldest.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(`   Duration: ${daysDiff} days`);
    }

    // Get total count
    const totalCount = await prisma.auditLog.count();
    console.log(`\n📊 TOTAL AUDIT LOGS: ${totalCount}`);

    // Check for retention policy eligibility
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const oldLogsCount = await prisma.auditLog.count({
      where: {
        createdAt: { lt: oneYearAgo },
        action: { notIn: ['DELETE', 'EXPORT'] },
      },
    });

    if (oldLogsCount > 0) {
      console.log(`\n🗑️  ELIGIBLE FOR CLEANUP: ${oldLogsCount} logs older than 1 year`);
      console.log('   Run: GET /api/audit-logs/cleanup to clean them up');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification Complete\n');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the verification
verifyAuditCoverage();
