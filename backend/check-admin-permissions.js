const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function checkAdminPermissions() {
  try {
    console.log('🔍 Checking Administrator role permissions...');
    
    // Find Administrator role with all permissions
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrator' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        userRoles: {
          include: {
            user: true
          }
        }
      }
    });

    if (!adminRole) {
      console.log('❌ Administrator role not found');
      return;
    }

    console.log('📋 Administrator Role Details:');
    console.log(`- ID: ${adminRole.id}`);
    console.log(`- Name: ${adminRole.name}`);
    console.log(`- Description: ${adminRole.description}`);
    console.log(`- Total Permissions: ${adminRole.permissions.length}`);
    
    console.log('\n🔑 Administrator Permissions:');
    adminRole.permissions.forEach(rp => {
      const perm = rp.permission;
      console.log(`- ${perm.code}: ${perm.name} (${perm.category})`);
    });

    console.log('\n👥 Users with Administrator Role:');
    adminRole.userRoles.forEach(ur => {
      console.log(`- ${ur.user.email} (ID: ${ur.user.id})`);
    });

    // Also check specific admin@bank.com user permissions
    console.log('\n🔍 Checking admin@bank.com specific permissions...');
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@bank.com' },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
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

    if (adminUser) {
      console.log(`👤 User: ${adminUser.email}`);
      adminUser.userRoles.forEach(ur => {
        console.log(`📋 Role: ${ur.role.name} (${ur.role.permissions.length} permissions)`);
        ur.role.permissions.forEach(rp => {
          console.log(`  - ${rp.permission.code}: ${rp.permission.name}`);
        });
      });
    } else {
      console.log('❌ admin@bank.com user not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPermissions();