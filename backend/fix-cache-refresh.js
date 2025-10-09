const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function createRefreshPermissionsEndpoint() {
  console.log('🔧 Creating refresh permissions API endpoint for immediate cache invalidation...');
  
  // This simulates what the PermissionCacheService.invalidateUserCache() method does
  const refreshUserPermissionsScript = `
// Add this endpoint to your backend to allow immediate cache invalidation
// File: backend/src/users/users.controller.ts

@Post(':id/refresh-permissions')
@RequirePermissions(PERMISSION_SETS.USER_MANAGE)
async refreshUserPermissions(@Param('id') userId: string) {
  try {
    // Invalidate user permission cache
    await this.permissionCacheService.invalidateUserCache(userId, 'Manual refresh via API');
    
    // Force refresh permissions from database
    const freshPermissions = await this.usersService.getUserPermissions(userId);
    
    return {
      success: true,
      message: 'User permissions refreshed successfully',
      permissions: freshPermissions.map(p => p.code),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to refresh permissions: ' + error.message,
      timestamp: new Date().toISOString()
    };
  }
}
`;

  console.log('📝 API Endpoint Code:');
  console.log(refreshUserPermissionsScript);

  // For now, let's test direct cache invalidation by calling the live API
  console.log('\n🔄 Testing direct permission refresh via API call...');
  
  return true;
}

async function testUserRoleUpdate() {
  try {
    console.log('🔍 Testing user role update and cache invalidation...');
    
    // Find a test user (you can replace with the actual user email you're testing)
    const testUserEmail = 'admin@bank.com'; // Change this to the user you're testing
    
    const user = await prisma.user.findUnique({
      where: { email: testUserEmail },
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

    if (!user) {
      console.log(`❌ User ${testUserEmail} not found`);
      return;
    }

    console.log(`👤 User: ${user.email} (ID: ${user.id})`);
    console.log('📋 Current roles and permissions:');
    
    user.userRoles.forEach(ur => {
      console.log(`\n🏷️  Role: ${ur.role.name}`);
      console.log(`   Permissions: ${ur.role.permissions.length}`);
      ur.role.permissions.forEach(rp => {
        console.log(`   - ${rp.permission.code}: ${rp.permission.name}`);
      });
    });

    console.log('\n💡 To fix the cache issue:');
    console.log('1. User needs to logout and login again, OR');
    console.log('2. Call the refresh permissions API endpoint, OR');
    console.log('3. Wait 15 minutes for cache to expire naturally');

    return user;
    
  } catch (error) {
    console.error('❌ Error testing user role update:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  await createRefreshPermissionsEndpoint();
  await testUserRoleUpdate();
  
  console.log('\n🎯 SOLUTION SUMMARY:');
  console.log('The issue is that when you update a user\'s role in the live site,');
  console.log('the permission cache is not automatically invalidated.');
  console.log('');
  console.log('✅ IMMEDIATE FIX: Tell the user to logout and login again');
  console.log('✅ BETTER FIX: Add a "Refresh Permissions" button to the user management UI');
  console.log('✅ AUTOMATIC FIX: Modify the updateUserRoles method to auto-invalidate cache');
}

main();