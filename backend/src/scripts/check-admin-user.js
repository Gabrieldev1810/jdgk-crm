
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('Checking Admin user...');
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      },
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
      console.log('No ADMIN user found!');
    } else {
      console.log('Admin user found:', adminUser.email);
      console.log('Role field:', adminUser.role);
      console.log('Roles relation:', JSON.stringify(adminUser.userRoles, null, 2));
      
      // Check if the user has the 'ADMIN' role in the roles relation
      const hasAdminRole = adminUser.userRoles && adminUser.userRoles.some(ur => ur.role.name === 'ADMIN');
      console.log('Has ADMIN role in relation:', hasAdminRole);
    }

  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
