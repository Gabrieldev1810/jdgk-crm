const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function diagnosticAndFix() {
  try {
    console.log('🔍 Comprehensive role assignment diagnostic and fix...');
    
    // 1. Check all users and their role assignments
    const users = await prisma.user.findMany({
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
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Get the 10 most recent users
    });

    console.log('\n👥 Recent users and their role assignments:');
    users.forEach(user => {
      console.log(`\n📧 ${user.email} (${user.role || 'no role'}) - Created: ${user.createdAt.toISOString().split('T')[0]}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Active: ${user.isActive}`);
      
      if (user.userRoles.length === 0) {
        console.log('   ❌ NO ROLES ASSIGNED!');
      } else {
        user.userRoles.forEach(ur => {
          console.log(`   🏷️  ${ur.role.name} (${ur.role.permissions.length} permissions) - Active: ${ur.isActive}`);
          if (ur.expiresAt) {
            console.log(`      ⏰ Expires: ${ur.expiresAt}`);
          }
        });
      }
    });

    // 2. Find users with no role assignments or only agent roles
    console.log('\n🚨 Users with potential role issues:');
    const problematicUsers = users.filter(user => {
      const hasActiveRoles = user.userRoles.some(ur => ur.isActive && (!ur.expiresAt || ur.expiresAt > new Date()));
      const hasOnlyAgentRoles = user.userRoles.every(ur => ur.role.name.toLowerCase() === 'agent');
      return !hasActiveRoles || (user.role === 'admin' && hasOnlyAgentRoles);
    });

    if (problematicUsers.length > 0) {
      console.log('Found users that need role fixes:');
      for (const user of problematicUsers) {
        console.log(`- ${user.email}: Issue detected`);
      }
    } else {
      console.log('✅ No obvious role assignment issues found');
    }

    // 3. Check if there are users with super admin role assignments but getting agent access
    console.log('\n🔍 Checking super admin role assignments...');
    const superAdminRole = await prisma.role.findFirst({
      where: { 
        OR: [
          { name: { contains: 'super admin', mode: 'insensitive' } },
          { name: { contains: 'administrator', mode: 'insensitive' } }
        ]
      },
      include: {
        userRoles: {
          include: {
            user: true
          }
        },
        permissions: true
      }
    });

    if (superAdminRole) {
      console.log(`✅ Found admin role: ${superAdminRole.name} with ${superAdminRole.permissions.length} permissions`);
      console.log('Users assigned to this role:');
      superAdminRole.userRoles.forEach(ur => {
        console.log(`- ${ur.user.email} (Active: ${ur.isActive}, Expires: ${ur.expiresAt || 'Never'})`);
      });
    }

    // 4. Check the default role assignment logic
    console.log('\n🔧 Checking default role assignment system...');
    const agentRole = await prisma.role.findFirst({
      where: { name: { contains: 'agent', mode: 'insensitive' } }
    });
    
    if (agentRole) {
      console.log(`📝 Default Agent role found: ${agentRole.name} (ID: ${agentRole.id})`);
    }

    return {
      totalUsers: users.length,
      problematicUsers: problematicUsers.length,
      superAdminRole,
      agentRole
    };
    
  } catch (error) {
    console.error('❌ Error in diagnostic:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function fixUserRoleAssignments() {
  try {
    console.log('\n🔧 Starting automatic role assignment fix...');
    
    // Find users who should have admin roles but don't
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'admin', mode: 'insensitive' } },
          { role: 'admin' },
          { role: 'super_admin' }
        ]
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log(`\n👑 Found ${adminUsers.length} admin users to check:`);
    
    for (const user of adminUsers) {
      console.log(`\nProcessing: ${user.email}`);
      
      // Check if user has proper admin role
      const hasActiveAdminRole = user.userRoles.some(ur => 
        ur.isActive && 
        (ur.role.name.toLowerCase().includes('admin') || ur.role.name.toLowerCase().includes('administrator')) &&
        (!ur.expiresAt || ur.expiresAt > new Date())
      );

      if (!hasActiveAdminRole) {
        console.log(`❌ ${user.email} missing active admin role. Fixing...`);
        
        // Find the best admin role (prefer "super admin" over "Administrator")
        let adminRole = await prisma.role.findFirst({
          where: { name: { contains: 'super admin', mode: 'insensitive' } }
        });
        
        if (!adminRole) {
          adminRole = await prisma.role.findFirst({
            where: { name: { contains: 'administrator', mode: 'insensitive' } }
          });
        }

        if (adminRole) {
          // Deactivate existing roles
          await prisma.userRole.updateMany({
            where: { userId: user.id },
            data: { isActive: false }
          });

          // Assign proper admin role
          await prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: adminRole.id,
              isActive: true,
              assignedById: user.id // Self-assigned during fix
            }
          });

          console.log(`✅ Assigned ${adminRole.name} role to ${user.email}`);
        } else {
          console.log(`❌ No admin role found in database`);
        }
      } else {
        console.log(`✅ ${user.email} already has active admin role`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing role assignments:', error.message);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive role diagnostic and fix...\n');
  
  const diagnostic = await diagnosticAndFix();
  
  if (diagnostic && diagnostic.problematicUsers > 0) {
    console.log('\n🔧 Attempting to fix role assignment issues...');
    await fixUserRoleAssignments();
    
    console.log('\n✅ Re-running diagnostic to verify fixes...');
    await diagnosticAndFix();
  }
  
  console.log('\n📋 SUMMARY AND RECOMMENDATIONS:');
  console.log('1. ✅ Ensure both "Administrator" and "super admin" roles have all permissions');
  console.log('2. ✅ Check that new users get proper role assignments in the UI');
  console.log('3. ✅ Verify cache invalidation works when roles are updated');
  console.log('4. 💡 Consider making "Administrator" the default admin role name');
  console.log('5. 🔄 Users should logout/login or call refresh endpoint after role changes');
}

main().catch(console.error);