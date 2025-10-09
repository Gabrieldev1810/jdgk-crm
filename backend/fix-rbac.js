const { PrismaClient } = require('@prisma/client');

async function fixRbacPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing RBAC permissions...');
    
    // Find Administrator role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrator' }
    });
    
    if (!adminRole) {
      console.error('❌ Administrator role not found');
      return;
    }
    
    console.log(`✅ Found Administrator role: ${adminRole.id}`);
    
    // Find rbac permissions
    const rbacPermissions = await prisma.permission.findMany({
      where: {
        code: { in: ['rbac.view', 'rbac.manage'] }
      }
    });
    
    console.log(`✅ Found ${rbacPermissions.length} RBAC permissions`);
    
    // Check existing assignments
    const existing = await prisma.rolePermission.findMany({
      where: {
        roleId: adminRole.id,
        permissionId: { in: rbacPermissions.map(p => p.id) }
      }
    });
    
    console.log(`✅ Found ${existing.length} existing RBAC permission assignments`);
    
    // Add missing assignments
    const toAdd = rbacPermissions.filter(p => 
      !existing.some(e => e.permissionId === p.id)
    );
    
    if (toAdd.length > 0) {
      await prisma.rolePermission.createMany({
        data: toAdd.map(permission => ({
          roleId: adminRole.id,
          permissionId: permission.id,
          grantedById: null,
        }))
      });
      
      console.log(`✅ Added ${toAdd.length} RBAC permissions to Administrator role:`);
      toAdd.forEach(p => console.log(`   - ${p.code}`));
    } else {
      console.log('✅ All RBAC permissions already assigned');
    }
    
    // Find all admin users to invalidate their cache
    const adminUsers = await prisma.userRole.findMany({
      where: { roleId: adminRole.id },
      include: { user: true }
    });
    
    console.log(`🔄 Invalidating cache for ${adminUsers.length} admin users...`);
    
    // Call cache invalidation endpoint for each admin user
    for (const userRole of adminUsers) {
      try {
        const response = await fetch('http://localhost:3000/api/rbac/bootstrap/init-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invalidateCache: true, userId: userRole.userId })
        });
        
        console.log(`   - Cache invalidation for ${userRole.user.email}: ${response.status}`);
      } catch (fetchError) {
        console.log(`   - Cache invalidation for ${userRole.user.email}: Network error (${fetchError.message})`);
      }
    }
    
    console.log('✅ RBAC permissions fix complete!');
    
  } catch (error) {
    console.error('❌ Error fixing RBAC permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRbacPermissions();