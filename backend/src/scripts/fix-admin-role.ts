
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bank.com';
  
  console.log(`Updating role for user: ${email}`);

  try {
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        vicidialUserId: '1002' // Fixing this as well while we are at it
      },
    });

    console.log('Successfully updated user.');
    console.log('Updated User:', updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
