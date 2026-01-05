
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@bank.com';
  
  console.log(`Checking RBAC for user: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error('User not found!');
    return;
  }

  console.log(`User found: ${user.id}`);

  // 1. Find or Create ADMIN role
  let adminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    console.log('ADMIN role not found. Creating...');
    adminRole = await prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrator with full access',
        isSystem: true,
      },
    });
    console.log('ADMIN role created.');
  } else {
    console.log(`ADMIN role found: ${adminRole.id}`);
  }

  // 2. Check if user has this role
  const userRole = await prisma.userRole.findFirst({
    where: {
      userId: user.id,
      roleId: adminRole.id,
    },
  });

  if (!userRole) {
    console.log('User does not have ADMIN role in RBAC. Assigning...');
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
        assignedById: user.id, // Self-assigned for fix
      },
    });
    console.log('ADMIN role assigned to user.');
  } else {
    console.log('User already has ADMIN role in RBAC.');
    if (!userRole.isActive) {
        console.log('UserRole is inactive. Activating...');
        await prisma.userRole.update({
            where: { id: userRole.id },
            data: { isActive: true }
        });
        console.log('UserRole activated.');
    }
  }

  // 3. Verify permissions (optional, but good to check)
  const permissions = await prisma.rolePermission.findMany({
    where: { roleId: adminRole.id },
    include: { permission: true },
  });

  console.log(`ADMIN role has ${permissions.length} permissions.`);
  
  if (permissions.length === 0) {
      console.log('WARNING: ADMIN role has NO permissions! You might need to seed permissions.');
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
