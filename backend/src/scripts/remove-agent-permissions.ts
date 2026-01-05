import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Removing specific permissions from Agent role...');

  // 1. Find the Agent role
  let agentRole = await prisma.role.findFirst({
    where: { name: 'AGENT' },
  });

  if (!agentRole) {
    agentRole = await prisma.role.findFirst({
        where: { name: 'Agent' },
    });
  }

  if (!agentRole) {
    console.error('Agent role not found!');
    process.exit(1);
  }

  console.log(`Found Agent role: ${agentRole.name} (ID: ${agentRole.id})`);

  // 2. Define permissions to remove
  const permissionsToRemove = [
    'calls.view',
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
