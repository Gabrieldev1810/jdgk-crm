
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bank.com';
  const newPassword = 'adminPassword123!';
  
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  console.log(`Password for ${email} reset to: ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
