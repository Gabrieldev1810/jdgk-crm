
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'asuncionreymart30@gmail.com';
  
  console.log(`Clearing vicidialUserId for user: ${email}`);

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found.');
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        vicidialUserId: null,
      },
    });

    console.log('Successfully cleared vicidialUserId.');
    console.log('Updated User:', updatedUser);
  } catch (error) {
    console.error('Error clearing vicidialUserId:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
