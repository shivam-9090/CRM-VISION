const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, prefix, message) {
  console.log(`${color}[${prefix}]${colors.reset} ${message}`);
}

function info(message) { colorLog(colors.blue, 'INFO', message); }
function success(message) { colorLog(colors.green, 'SUCCESS', message); }
function warning(message) { colorLog(colors.yellow, 'WARNING', message); }
function error(message) { colorLog(colors.red, 'ERROR', message); }

// Check if command exists
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

// Check requirements
function checkRequirements() {
  info('Checking requirements...');
  
  const requirements = [
    { name: 'Node.js', command: 'node', url: 'https://nodejs.org/' },
    { name: 'npm', command: 'npm', url: 'https://npmjs.com/' },
    { name: 'Docker', command: 'docker', url: 'https://docker.com/' }
  ];

  for (const req of requirements) {
    if (!commandExists(req.command)) {
      error(`${req.name} is not installed. Please install from ${req.url}`);
      process.exit(1);
    }
  }
  
  success('All requirements satisfied!');
}

// Setup environment files
function setupEnvFiles() {
  info('Setting up environment files...');
  
  const envFiles = [
    { example: 'backend/.env.example', target: 'backend/.env' },
    { example: 'frontend/.env.example', target: 'frontend/.env.local' }
  ];

  for (const { example, target } of envFiles) {
    if (!fs.existsSync(target)) {
      if (fs.existsSync(example)) {
        fs.copyFileSync(example, target);
        success(`Created ${target}`);
      } else {
        warning(`Example file ${example} not found, skipping...`);
      }
    } else {
      warning(`${target} already exists, skipping...`);
    }
  }
}

// Install dependencies
async function installDependencies() {
  info('Installing dependencies...');
  
  const projects = ['backend', 'frontend'];
  
  for (const project of projects) {
    if (fs.existsSync(path.join(project, 'package.json'))) {
      info(`Installing ${project} dependencies...`);
      try {
        execSync('npm install', { 
          cwd: project, 
          stdio: 'inherit',
          timeout: 300000 // 5 minutes timeout
        });
        success(`${project} dependencies installed!`);
      } catch (err) {
        error(`Failed to install ${project} dependencies`);
        throw err;
      }
    }
  }
}

// Setup database
async function setupDatabase() {
  info('Setting up database...');
  
  try {
    // Start PostgreSQL container
    info('Starting PostgreSQL container...');
    execSync('docker-compose up -d postgres', { stdio: 'inherit' });
    
    // Wait for database
    info('Waiting for database to be ready...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Run migrations
    info('Running database migrations...');
    try {
      execSync('npx prisma migrate dev --name init', { 
        cwd: 'backend', 
        stdio: 'inherit' 
      });
    } catch (err) {
      warning('Migration may have failed, continuing...');
    }
    
    // Seed database
    info('Seeding database with sample data...');
    try {
      execSync('npx prisma db seed', { 
        cwd: 'backend', 
        stdio: 'inherit' 
      });
    } catch (err) {
      warning('Database seeding may have failed, continuing...');
    }
    
    success('Database setup completed!');
  } catch (err) {
    error('Database setup failed');
    throw err;
  }
}

// Show completion message
function showCompletionMessage() {
  const localIP = getLocalIP();
  
  console.log('\n' + '='.repeat(80));
  console.log('                    🎉 CRM-VISION SETUP COMPLETED! 🎉');
  console.log('='.repeat(80));
  
  console.log('\n📋 Next Steps:');
  console.log('━'.repeat(80));
  
  console.log('\n🚀 Start Development Servers:');
  console.log('   Backend:  cd backend && npm run start:dev');
  console.log('   Frontend: cd frontend && npm run dev');
  console.log('   Both:     npm start (from root directory)');
  
  console.log('\n🐳 Or use Docker (Recommended):');
  console.log('   docker-compose up -d');
  console.log('   npm run docker:up');
  
  console.log('\n🌐 Access URLs:');
  console.log('   Frontend:    http://localhost:3000');
  console.log('   Backend API: http://localhost:3001/api');
  console.log('   Database:    postgresql://postgres:postgres@localhost:5432/crm_db');
  
  console.log('\n📱 For Cross-Device Access:');
  console.log(`   Update frontend/.env.local:`);
  console.log(`   NEXT_PUBLIC_API_URL=http://${localIP}:3001/api`);
  console.log('');
  console.log(`   Then access from other devices:`);
  console.log(`   Frontend: http://${localIP}:3000`);
  console.log(`   Backend:  http://${localIP}:3001/api`);
  
  console.log('\n🔐 Default Login Credentials:');
  console.log('   Email:    admin@company.com');
  console.log('   Password: admin123');
  
  console.log('\n📚 Available Commands:');
  console.log('   npm start           - Start both servers');
  console.log('   npm run docker:up   - Start with Docker');
  console.log('   npm run docker:down - Stop Docker containers');
  console.log('   npm run db:studio   - Open Prisma Studio');
  
  console.log('\n' + '━'.repeat(80));
  console.log('📖 View README.md for detailed documentation');
  console.log('🐛 Report issues at: https://github.com/shivam-9090/CRM-VISION/issues');
  console.log('='.repeat(80) + '\n');
}

// Main setup function
async function main() {
  try {
    console.log('='.repeat(80));
    console.log('                      CRM-VISION Setup Script');
    console.log('='.repeat(80) + '\n');
    
    checkRequirements();
    setupEnvFiles();
    await installDependencies();
    await setupDatabase();
    showCompletionMessage();
    
  } catch (err) {
    error('Setup failed!');
    console.error(err);
    process.exit(1);
  }
}

// Run main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { main };