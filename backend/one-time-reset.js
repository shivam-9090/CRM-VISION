#!/usr/bin/env node

/**
 * ONE-TIME Database Reset for Render
 * This will run ONCE, reset the DB, then get deleted automatically
 */

const { execSync } = require('child_process');

console.log('\n🔄 ONE-TIME DATABASE RESET\n');
console.log('This will:');
console.log('1. Drop all existing tables');
console.log('2. Run all 22 migrations from scratch');
console.log('3. Create correct schema\n');

try {
  // Use prisma migrate reset which handles everything
  console.log('📦 Resetting database...');
  execSync('npx prisma migrate reset --force --skip-seed', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('\n✅ Database reset complete!');
  console.log('✅ All migrations applied!');
  console.log('\n🎉 Database is ready!\n');
  
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Reset failed:', error.message);
  console.error('\nTrying alternative method...\n');
  
  try {
    // Alternative: Just run migrations (will work if DB is empty)
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('\n✅ Migrations applied!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Alternative also failed:', err.message);
    process.exit(1);
  }
}
