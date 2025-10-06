const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixDialcraftPasswords() {
  console.log('🔧 Fixing dialcraft.com account passwords...\n');
  
  try {
    // Update admin@dialcraft.com to use admin123
    await prisma.user.update({
      where: { email: 'admin@dialcraft.com' },
      data: {
        password: await bcrypt.hash('admin123', 12),
      },
    });
    console.log('✅ Updated admin@dialcraft.com password to: admin123');

    // Update manager@dialcraft.com to use manager123
    await prisma.user.update({
      where: { email: 'manager@dialcraft.com' },
      data: {
        password: await bcrypt.hash('manager123', 12),
      },
    });
    console.log('✅ Updated manager@dialcraft.com password to: manager123');

    // Update agent@dialcraft.com to use agent123
    await prisma.user.update({
      where: { email: 'agent@dialcraft.com' },
      data: {
        password: await bcrypt.hash('agent123', 12),
      },
    });
    console.log('✅ Updated agent@dialcraft.com password to: agent123');

    console.log('\n🎯 Current Demo Accounts:');
    console.log('Bank Accounts (password: demo123):');
    console.log('  • admin@bank.com / demo123');
    console.log('  • manager@bank.com / demo123');
    console.log('  • agent@bank.com / demo123');
    
    console.log('\nDialCraft Accounts:');
    console.log('  • admin@dialcraft.com / admin123');
    console.log('  • manager@dialcraft.com / manager123');
    console.log('  • agent@dialcraft.com / agent123');

  } catch (error) {
    console.error('❌ Error updating passwords:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDialcraftPasswords();