const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function fixSpecificUser() {
  try {
    console.log('🔧 Fixing gab.duano101898@gmail.com role assignment...');
    
    const userEmail = 'gab.duano101898@gmail.com';
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`👤 User: ${user.email}`);
    console.log(`📝 Role field: ${user.role}`);
    console.log(`🏷️  Current role assignments: ${user.userRoles.length}`);

    // Find the super admin role
    let superAdminRole = await prisma.role.findFirst({
      where: { name: { contains: 'super admin', mode: 'insensitive' } }
    });

    if (!superAdminRole) {
      console.log('⚠️  Super admin role not found, using Administrator role...');
      superAdminRole = await prisma.role.findFirst({
        where: { name: { contains: 'administrator', mode: 'insensitive' } }
      });
    }

    if (!superAdminRole) {
      console.log('❌ No admin role found');
      return;
    }

    console.log(`🎯 Target role: ${superAdminRole.name} (${superAdminRole.id})`);

    // Clear any existing role assignments
    await prisma.userRole.deleteMany({
      where: { userId: user.id }
    });

    // Assign the super admin role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: superAdminRole.id,
        isActive: true,
        assignedById: user.id // Self-assigned
      }
    });

    console.log(`✅ Successfully assigned ${superAdminRole.name} role to ${userEmail}`);

    // Verify the assignment
    const updatedUser = await prisma.user.findUnique({
      where: { email: userEmail },
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

    console.log(`\n✅ Verification:`);
    console.log(`📧 ${updatedUser.email}`);
    updatedUser.userRoles.forEach(ur => {
      console.log(`🏷️  ${ur.role.name} (${ur.role.permissions.length} permissions) - Active: ${ur.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error fixing user:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificUser();