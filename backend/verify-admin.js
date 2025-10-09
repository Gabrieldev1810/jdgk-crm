const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function verifyAdminAccess() {
  try {
    console.log('🔍 Verifying admin access...');
    
    // Find admin@bank.com user with roles
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@bank.com' },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!adminUser) {
      console.log('❌ User admin@bank.com not found');
      return;
    }

    console.log('👤 User:', adminUser.email);
    console.log('🆔 User ID:', adminUser.id);
    console.log('📋 Roles:', adminUser.userRoles.map(ur => `${ur.role.name} (ID: ${ur.role.id})`));
    
    // Check if user has Administrator role
    const hasAdminRole = adminUser.userRoles.some(ur => ur.role.name === 'Administrator');
    
    if (hasAdminRole) {
      console.log('✅ SUCCESS: admin@bank.com has Administrator role!');
      console.log('💡 Now logout and login again to refresh your session');
    } else {
      console.log('❌ ISSUE: admin@bank.com does not have Administrator role');
    }
    
  } catch (error) {
    console.error('❌ Error verifying admin access:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdminAccess();