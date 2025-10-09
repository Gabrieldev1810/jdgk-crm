const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || "postgresql://postgres:your_password@staging.digiedgesolutions.cloud:5432/dial_craft_db"
    }
  }
});

async function fixAllUsersWithMissingRoles() {
  try {
    console.log('🔧 Fixing all users with missing RBAC role assignments...');
    
    // Find all users who have role field but no active userRole assignments
    const users = await prisma.user.findMany({
      include: {
        userRoles: {
          where: {
            isActive: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          },
          include: {
            role: true
          }
        }
      }
    });

    console.log(`\n📊 Found ${users.length} total users to check:`);

    const usersNeedingFix = [];
    const roleMapping = {
      'ADMIN': 'Administrator',
      'admin': 'Administrator', 
      'super admin': 'super admin',
      'super_admin': 'super admin',
      'SUPER_ADMIN': 'super admin',
      'MANAGER': 'Manager',
      'manager': 'Manager',
      'AGENT': 'Agent',
      'agent': 'Agent',
      'SUPERVISOR': 'Supervisor',
      'supervisor': 'Supervisor'
    };

    for (const user of users) {
      const hasActiveRoles = user.userRoles.length > 0;
      const needsRoleAssignment = !hasActiveRoles && user.role;
      
      console.log(`\n👤 ${user.email}`);
      console.log(`   Legacy Role: ${user.role}`);
      console.log(`   Active RBAC Roles: ${user.userRoles.length}`);
      
      if (user.userRoles.length > 0) {
        user.userRoles.forEach(ur => {
          console.log(`     - ${ur.role.name}`);
        });
      }

      if (needsRoleAssignment) {
        console.log(`   ❌ NEEDS FIX: Missing RBAC role assignment`);
        usersNeedingFix.push({
          user,
          targetRole: roleMapping[user.role] || 'Agent'
        });
      } else if (!hasActiveRoles) {
        console.log(`   ⚠️  No legacy role and no RBAC roles - will assign Agent role`);
        usersNeedingFix.push({
          user,
          targetRole: 'Agent'
        });
      } else {
        console.log(`   ✅ OK: Has active RBAC roles`);
      }
    }

    console.log(`\n🔧 Found ${usersNeedingFix.length} users that need role assignment fixes:`);

    for (const { user, targetRole } of usersNeedingFix) {
      console.log(`\nFixing ${user.email} -> ${targetRole}`);
      
      // Find the target RBAC role
      const rbacRole = await prisma.role.findFirst({
        where: { 
          name: { contains: targetRole, mode: 'insensitive' }
        }
      });

      if (!rbacRole) {
        console.log(`   ❌ Role '${targetRole}' not found, skipping`);
        continue;
      }

      console.log(`   🎯 Target RBAC role: ${rbacRole.name} (${rbacRole.id})`);

      // Deactivate any existing role assignments (cleanup)
      await prisma.userRole.updateMany({
        where: { userId: user.id },
        data: { isActive: false }
      });

      // Create new role assignment
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: rbacRole.id,
          isActive: true,
          assignedById: user.id // Self-assigned during fix
        }
      });

      console.log(`   ✅ Successfully assigned ${rbacRole.name} to ${user.email}`);
    }

    // Verification: Re-check all users
    console.log('\n✅ VERIFICATION - Rechecking all users:');
    const verificationUsers = await prisma.user.findMany({
      include: {
        userRoles: {
          where: { isActive: true },
          include: { role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let fixedCount = 0;
    let stillBrokenCount = 0;

    for (const user of verificationUsers) {
      const hasRoles = user.userRoles.length > 0;
      console.log(`${hasRoles ? '✅' : '❌'} ${user.email}: ${user.userRoles.map(ur => ur.role.name).join(', ') || 'NO ROLES'}`);
      
      if (hasRoles) {
        fixedCount++;
      } else {
        stillBrokenCount++;
      }
    }

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`✅ Users with proper RBAC roles: ${fixedCount}`);
    console.log(`❌ Users still missing roles: ${stillBrokenCount}`);
    console.log(`🔧 Users fixed in this run: ${usersNeedingFix.length}`);

    return {
      totalUsers: users.length,
      usersFixed: usersNeedingFix.length,
      finalGoodCount: fixedCount,
      finalBrokenCount: stillBrokenCount
    };

  } catch (error) {
    console.error('❌ Error fixing users:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixAllUsersWithMissingRoles()
  .then((results) => {
    console.log('\n🎉 Fix completed successfully!');
    console.log('📋 Summary:', results);
    
    if (results.finalBrokenCount === 0) {
      console.log('\n✅ ALL USERS NOW HAVE PROPER RBAC ROLES!');
      console.log('💡 New users will automatically get proper role assignments');
      console.log('🔄 Existing users should logout/login to refresh their permissions');
    } else {
      console.log(`\n⚠️  ${results.finalBrokenCount} users still need manual attention`);
    }
  })
  .catch(console.error);