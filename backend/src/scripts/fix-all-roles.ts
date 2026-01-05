
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      role: 'ADMINISTRATOR'
    }
  });

  console.log(`Found ${users.length} users with role ADMINISTRATOR`);
  
  if (users.length > 0) {
    console.log('Updating them to ADMIN...');
    const result = await prisma.user.updateMany({
      where: { role: 'ADMINISTRATOR' },
      data: { role: 'ADMIN' }
    });
    console.log(`Updated ${result.count} users.`);
  }
}

main();
