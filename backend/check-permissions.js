const { PrismaClient } = require('@prisma/client');

async function checkUserPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking admin user permissions...');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
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
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Found user: ${adminUser.email} (ID: ${adminUser.id})`);
    console.log(`   Database role field: ${adminUser.role}`);
    console.log(`   RBAC roles: ${adminUser.userRoles.length}`);
    
    // List all roles and permissions
    adminUser.userRoles.forEach(userRole => {
      console.log(`\n🎭 Role: ${userRole.role.name}`);
      console.log(`   Permissions (${userRole.role.permissions.length}):`);
      
      const permissions = userRole.role.permissions.map(rp => rp.permission.code).sort();
      permissions.forEach(perm => {
        if (perm.startsWith('rbac.')) {
          console.log(`   ✅ ${perm} (RBAC permission)`);
        } else {
          console.log(`   - ${perm}`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserPermissions();