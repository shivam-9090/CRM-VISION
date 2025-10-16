const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    const users = await prisma.user.findMany({
      include: {
        company: true
      }
    });
    
    console.log('Users in database:');
    console.log(JSON.stringify(users, null, 2));
    
    const companies = await prisma.company.findMany();
    console.log('\nCompanies in database:');
    console.log(JSON.stringify(companies, null, 2));
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();