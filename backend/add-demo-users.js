const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addDemoUsers() {
  console.log('🌱 Adding additional demo users...');
  
  try {
    // Add manager@bank.com
    const managerUser = await prisma.user.upsert({
      where: { email: 'manager@bank.com' },
      update: {},
      create: {
        email: 'manager@bank.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Bank',
        lastName: 'Manager',
        role: 'MANAGER',
        isActive: true,
      },
    });

    // Add agent@bank.com
    const agentUser = await prisma.user.upsert({
      where: { email: 'agent@bank.com' },
      update: {},
      create: {
        email: 'agent@bank.com',
        password: await bcrypt.hash('demo123', 12),
        firstName: 'Bank',
        lastName: 'Agent',
        role: 'AGENT',
        isActive: true,
      },
    });

    // Update admin@bank.com to use demo123 password
    await prisma.user.update({
      where: { email: 'admin@bank.com' },
      data: {
        password: await bcrypt.hash('demo123', 12),
      },
    });

    console.log('✅ Added demo users:');
    console.log('Bank Admin: admin@bank.com / demo123');
    console.log('Bank Manager: manager@bank.com / demo123');
    console.log('Bank Agent: agent@bank.com / demo123');

  } catch (error) {
    console.error('❌ Error adding demo users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoUsers();