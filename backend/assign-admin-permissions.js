const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function assignPermissionsToAdmin() {
  try {
    console.log('🔧 Assigning all permissions to Administrator role...');
    
    // Find Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrator' }
    });

    if (!adminRole) {
      console.log('❌ Administrator role not found');
      return;
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();
    console.log(`📊 Found ${allPermissions.length} total permissions`);

    // Clear existing role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: adminRole.id }
    });
    console.log('🗑️  Cleared existing Administrator permissions');

    // Assign all permissions to Administrator role
    const rolePermissions = allPermissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissions
    });

    console.log(`✅ Successfully assigned ${allPermissions.length} permissions to Administrator role`);

    // List the assigned permissions by category
    const permissionsByCategory = {};
    allPermissions.forEach(perm => {
      if (!permissionsByCategory[perm.category]) {
        permissionsByCategory[perm.category] = [];
      }
      permissionsByCategory[perm.category].push(perm.code);
    });

    console.log('\n📋 Permissions assigned by category:');
    Object.entries(permissionsByCategory).forEach(([category, permissions]) => {
      console.log(`- ${category}: ${permissions.length} permissions`);
      permissions.forEach(code => console.log(`  • ${code}`));
    });
    
  } catch (error) {
    console.error('❌ Error assigning permissions:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

assignPermissionsToAdmin();