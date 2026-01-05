
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bank.com';
  const vicidialId = '1002';

  const user = await prisma.user.update({
    where: { email },
    data: {
        vicidialUserId: vicidialId
    }
  });

  console.log(`Updated user ${email} with vicidialUserId: ${vicidialId}`);
  console.log('New User Details:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
