const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client with production database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function fixAdminAccess() {
  try {
    console.log('🔍 Connecting to production database...');
    
    // Find admin@bank.com user
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

    console.log('👤 Found user:', adminUser.email);
    console.log('📋 Current roles:', adminUser.userRoles.map(ur => ur.role.name));

    // Find Administrator role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Administrator' }
    });

    if (!adminRole) {
      console.log('❌ Administrator role not found');
      return;
    }

    // Remove all existing roles for this user
    await prisma.userRole.deleteMany({
      where: { userId: adminUser.id }
    });
    console.log('🗑️  Removed all existing roles');

    // Assign Administrator role
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id
      }
    });

    console.log('✅ Successfully assigned Administrator role to admin@bank.com');

    // Verify the change
    const updatedUser = await prisma.user.findUnique({
      where: { email: 'admin@bank.com' },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    console.log('🎯 Updated roles:', updatedUser.userRoles.map(ur => ur.role.name));
    console.log('🔑 Total permissions:', updatedUser.userRoles.reduce((acc, ur) => acc + ur.role.rolePermissions.length, 0));
    
  } catch (error) {
    console.error('❌ Error fixing admin access:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminAccess();