
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking permissions...');

  const permissions = await prisma.permission.findMany();
  console.log(`Found ${permissions.length} permissions.`);

  if (permissions.length > 0) {
    console.log('Sample permissions:', permissions.slice(0, 5).map(p => p.code));
  } else {
    console.log('No permissions found in DB.');
  }

  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    console.error('ADMIN role not found!');
    return;
  }

  const defaultPermissions = [
    { code: 'users.view_all', name: 'View All Users', category: 'Users', description: 'View all users', resource: 'users', action: 'view_all' },
    { code: 'users.manage', name: 'Manage Users', category: 'Users', description: 'Manage users', resource: 'users', action: 'manage' },
    { code: 'users.view_team', name: 'View Team Users', category: 'Users', description: 'View team users', resource: 'users', action: 'view_team' },
    { code: 'roles.view', name: 'View Roles', category: 'RBAC', description: 'View roles', resource: 'roles', action: 'view' },
    { code: 'roles.manage', name: 'Manage Roles', category: 'RBAC', description: 'Manage roles', resource: 'roles', action: 'manage' },
    { code: 'permissions.view', name: 'View Permissions', category: 'RBAC', description: 'View permissions', resource: 'permissions', action: 'view' },
    { code: 'permissions.manage', name: 'Manage Permissions', category: 'RBAC', description: 'Manage permissions', resource: 'permissions', action: 'manage' },
    { code: 'rbac.view', name: 'View RBAC Data', category: 'RBAC Management', resource: 'rbac', action: 'view' },
    { code: 'rbac.manage', name: 'Manage RBAC Data', category: 'RBAC Management', resource: 'rbac', action: 'manage' },
  ];

  console.log('Ensuring default permissions exist...');
  for (const p of defaultPermissions) {
    const exists = await prisma.permission.findUnique({ where: { code: p.code } });
    if (!exists) {
      await prisma.permission.create({
        data: {
          code: p.code,
          name: p.name,
          category: p.category,
          description: p.description,
          resource: p.resource,
          action: p.action,
          isSystem: true,
        }
      });
      console.log(`Created permission: ${p.code}`);
    }
  }

  // Re-fetch permissions
  const allPermissions = await prisma.permission.findMany();

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@bank.com' } });

  // Assign all to ADMIN
  console.log(`Assigning ${allPermissions.length} permissions to ADMIN role...`);
  
  let assignedCount = 0;
  for (const p of allPermissions) {
    const exists = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: p.id,
        }
      }
    });

    if (!exists) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: p.id,
          grantedById: adminUser?.id,
        }
      });
      assignedCount++;
    }
  }

  console.log(`Assigned ${assignedCount} new permissions to ADMIN.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
