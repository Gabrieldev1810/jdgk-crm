import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo users...');
  
  // Use consistent demo123 password for all demo accounts
  const demoPassword = 'demo123';
  const hashedPassword = await bcrypt.hash(demoPassword, 12);
  
  // Bank demo accounts (recommended for frontend demo)
  const bankAdminUser = await prisma.user.upsert({
    where: { email: 'admin@bank.com' },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      email: 'admin@bank.com',
      password: hashedPassword,
      firstName: 'Bank',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const bankManagerUser = await prisma.user.upsert({
    where: { email: 'manager@bank.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'manager@bank.com',
      password: hashedPassword,
      firstName: 'Bank',
      lastName: 'Manager',
      role: 'MANAGER',
      isActive: true,
    },
  });

  const bankAgentUser = await prisma.user.upsert({
    where: { email: 'agent@bank.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'agent@bank.com',
      password: hashedPassword,
      firstName: 'Bank',
      lastName: 'Agent',
      role: 'AGENT',
      isActive: true,
    },
  });

  // Legacy dialcraft accounts (kept for backward compatibility)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dialcraft.com' },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      email: 'admin@dialcraft.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@dialcraft.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'manager@dialcraft.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Manager',
      role: 'MANAGER',
      isActive: true,
    },
  });

  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@dialcraft.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'agent@dialcraft.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Agent',
      role: 'AGENT',
      isActive: true,
    },
  });

  console.log('✅ Created demo users (all with password: demo123):');
  console.log('');
  console.log('🏦 RECOMMENDED BANK DEMO ACCOUNTS:');
  console.log('   Super Admin: admin@bank.com / demo123');
  console.log('   Manager:     manager@bank.com / demo123');
  console.log('   Agent:       agent@bank.com / demo123');
  console.log('');
  console.log('🔧 SYSTEM ACCOUNTS (legacy):');
  console.log('   System Admin: admin@dialcraft.com / demo123');
  console.log('   System Manager: manager@dialcraft.com / demo123');
  console.log('   System Agent: agent@dialcraft.com / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });