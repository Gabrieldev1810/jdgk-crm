const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function checkSuperAdminRole() {
  try {
    console.log('🔍 Checking Super Admin role and permissions...');
    
    // Find all roles
    const roles = await prisma.role.findMany({
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

    console.log('\n📋 All Roles and their permissions:');
    roles.forEach(role => {
      console.log(`\n🏷️  Role: ${role.name} (ID: ${role.id})`);
      console.log(`   Description: ${role.description}`);
      console.log(`   Permissions: ${role.permissions.length}`);
      
      if (role.permissions.length > 0) {
        console.log('   🔑 Permissions:');
        role.permissions.forEach(rp => {
          console.log(`     - ${rp.permission.code}: ${rp.permission.name}`);
        });
      }
      
      if (role.userRoles.length > 0) {
        console.log('   👥 Users:');
        role.userRoles.forEach(ur => {
          console.log(`     - ${ur.user.email}`);
        });
      }
    });

    // Check if "Super Admin" role exists
    const superAdminRole = roles.find(r => 
      r.name.toLowerCase().includes('super') || 
      r.name.toLowerCase().includes('admin')
    );

    if (superAdminRole && superAdminRole.permissions.length === 0) {
      console.log('\n⚠️  Found Super Admin role with no permissions! Fixing...');
      
      // Get all permissions
      const allPermissions = await prisma.permission.findMany();
      
      // Assign all permissions to Super Admin role
      const rolePermissions = allPermissions.map(permission => ({
        roleId: superAdminRole.id,
        permissionId: permission.id
      }));

      // Clear existing permissions first
      await prisma.rolePermission.deleteMany({
        where: { roleId: superAdminRole.id }
      });

      // Add all permissions
      await prisma.rolePermission.createMany({
        data: rolePermissions
      });

      console.log(`✅ Assigned ${allPermissions.length} permissions to ${superAdminRole.name} role`);
    }
    
  } catch (error) {
    console.error('❌ Error checking Super Admin role:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdminRole();