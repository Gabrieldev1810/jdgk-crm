
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bank.com';
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        vicidialUserId: true
    }
  });

  console.log('User Details:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
