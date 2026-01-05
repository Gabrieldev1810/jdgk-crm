import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating Romeo user...');

  const email = 'romeo.lomerio@example.com'; // Assuming email
  
  // Check if exists
  const existing = await prisma.user.findFirst({
      where: { 
          OR: [
              { email: { contains: 'romeo' } },
              { vicidialUserId: '1002' }
          ]
      }
  });

  if (existing) {
      console.log('User Romeo already exists:', existing);
      // Update vicidial ID if needed
      if (existing.vicidialUserId !== '1002') {
          await prisma.user.update({
              where: { id: existing.id },
              data: { vicidialUserId: '1002' }
          });
          console.log('Updated Vicidial ID to 1002');
      }
      return;
  }

  // Create if not exists
  // We need a role ID first
  // const agentRole = await prisma.role.findFirst({ where: { name: 'AGENT' } });
  
  // if (!agentRole) {
  //     console.error('Agent role not found');
  //     return;
  // }

  const user = await prisma.user.create({
    data: {
      email: 'romeo@example.com',
      password: 'password123', // Hash this in real app
      firstName: 'Romeo',
      lastName: 'Lomerio',
      role: 'AGENT', // Schema uses string for role, not relation
      vicidialUserId: '1002',
      isActive: true
    }
  });

  console.log('Created user:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
