
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const vicidialId = '1002';
  const user = await prisma.user.findUnique({
    where: { vicidialUserId: vicidialId },
    select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        vicidialUserId: true
    }
  });

  console.log(`User with vicidialUserId ${vicidialId}:`, user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
