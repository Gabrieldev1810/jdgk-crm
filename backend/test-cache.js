const { PrismaClient } = require('@prisma/client');

async function testPermissionCache() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testing permission cache for admin user...');
    
    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@bank.com' }
    });
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }
    
    console.log(`✅ Found user: ${adminUser.email} (ID: ${adminUser.id})`);
    
    // Test the same database query that the cache service uses
    const userRoles = await prisma.userRole.findMany({
      where: { 
        userId: adminUser.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              },
              where: {
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } }
                ]
              }
            }
          }
        }
      }
    });

    // Flatten permissions from all roles (same as cache service)
    const permissions = userRoles.flatMap(ur =>
      ur.role.permissions.map(rp => rp.permission.code)
    );

    // Remove duplicates (same as cache service)
    const uniquePermissions = [...new Set(permissions)];
    
    console.log(`\n📝 Permission Query Results:`);
    console.log(`   User roles found: ${userRoles.length}`);
    console.log(`   Total permission grants: ${permissions.length}`);
    console.log(`   Unique permissions: ${uniquePermissions.length}`);
    
    console.log(`\n🔍 RBAC Permissions Check:`);
    const rbacPermissions = uniquePermissions.filter(p => p.startsWith('rbac.'));
    rbacPermissions.forEach(perm => {
      console.log(`   ✅ ${perm}`);
    });
    
    if (rbacPermissions.length === 0) {
      console.log(`   ❌ No RBAC permissions found!`);
    }
    
    console.log(`\n📋 All permissions:`);
    uniquePermissions.sort().forEach(perm => {
      console.log(`   - ${perm}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing permission cache:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPermissionCache();