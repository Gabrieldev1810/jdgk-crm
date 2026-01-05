import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating Agent permissions...');

  // 1. Find the Agent role
  const agentRole = await prisma.role.findFirst({
    where: { name: 'Agent' },
  });

  if (!agentRole) {
    console.error('Agent role not found!');
    process.exit(1);
  }

  console.log(`Found Agent role with ID: ${agentRole.id}`);

  // 2. Identify permissions to remove
  const permissionsToRemove = [
    'calls.view',
    'calls.create',
    'dispositions.view'
  ];

  // 3. Find the permission IDs
  const permissions = await prisma.permission.findMany({
    where: {
      code: { in: permissionsToRemove }
    }
  });

  if (permissions.length === 0) {
    console.log('No permissions found to remove.');
    return;
  }

  const permissionIds = permissions.map(p => p.id);
  console.log(`Found ${permissionIds.length} permissions to remove: ${permissions.map(p => p.code).join(', ')}`);

  // 4. Delete the RolePermission entries
  const result = await prisma.rolePermission.deleteMany({
    where: {
      roleId: agentRole.id,
      permissionId: { in: permissionIds }
    }
  });

  console.log(`Removed ${result.count} permission assignments from Agent role.`);
  console.log('Agent access update complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
