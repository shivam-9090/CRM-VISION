#!/usr/bin/env node

/**
 * Database Reset and Migration Script for Render
 * 
 * This script ensures a clean database state by:
 * 1. Dropping all tables and types
 * 2. Running all migrations from scratch
 */

const { execSync } = require('child_process');

console.log('🔄 Starting database reset and migration...\n');

try {
  // Step 1: Reset database (drops all tables)
  console.log('📦 Step 1: Resetting database...');
  execSync('npx prisma migrate reset --force --skip-seed', { stdio: 'inherit' });
  
  console.log('\n✅ Database reset complete!\n');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}

console.log('🎉 Database is ready!\n');
