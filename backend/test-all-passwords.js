const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAllPasswords() {
  console.log('🔐 Testing ALL account passwords...\n');
  
  const testAccounts = [
    { email: 'admin@dialcraft.com', passwords: ['admin123', 'demo123'] },
    { email: 'manager@dialcraft.com', passwords: ['manager123', 'demo123'] },
    { email: 'agent@dialcraft.com', passwords: ['agent123', 'demo123'] },
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

testAllPasswords();