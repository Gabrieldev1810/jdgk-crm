const { PrismaClient } = require('@prisma/client');

async function testAccount() {
  const prisma = new PrismaClient();
  
  try {
    const account = await prisma.account.findFirst();
    console.log('Sample account:', JSON.stringify(account, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAccount();