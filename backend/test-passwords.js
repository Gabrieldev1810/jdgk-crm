const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPasswords() {
  console.log('🔐 Testing demo account passwords...\n');
  
  const testAccounts = [
    { email: 'admin@bank.com', passwords: ['demo123', 'admin123'] },
    { email: 'manager@bank.com', passwords: ['demo123', 'manager123'] },
    { email: 'agent@bank.com', passwords: ['demo123', 'agent123'] }
  ];

  for (const account of testAccounts) {
    console.log(`Testing ${account.email}:`);
    
    const user = await prisma.user.findUnique({
      where: { email: account.email }
    });

    if (!user) {
      console.log(`❌ User not found\n`);
      continue;
    }

    for (const password of account.passwords) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`  ${password}: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

testPasswords();