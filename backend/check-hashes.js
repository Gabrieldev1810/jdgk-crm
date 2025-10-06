const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showPasswordHashes() {
  console.log('🔍 Checking password hashes for dialcraft.com accounts...\n');
  
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: 'dialcraft.com'
      }
    },
    select: {
      email: true,
      password: true,
      createdAt: true
    }
  });

  users.forEach(user => {
    console.log(`${user.email}:`);
    console.log(`  Hash: ${user.password.substring(0, 30)}...`);
    console.log(`  Created: ${user.createdAt}`);
    console.log('');
  });

  await prisma.$disconnect();
}

showPasswordHashes();