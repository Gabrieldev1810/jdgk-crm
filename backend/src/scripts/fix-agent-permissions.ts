import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing Agent permissions...');

  // 1. Find the Agent role
  // Note: Role names might be case sensitive or vary. Usually 'AGENT' or 'Agent'.
  // Let's try to find by name 'AGENT' (uppercase) as per the seed, or 'Agent'.
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

  // 2. Define permissions to grant
  const permissionsToGrant = [
    'calls.view',
    'calls.create',
    'dispositions.view',
    'accounts.view'
  ];

  // 3. Ensure permissions exist in Permission table
  // We assume they exist from seed, but let's check.
  const existingPermissions = await prisma.permission.findMany({
    where: {
      code: { in: permissionsToGrant }
    }
  });

  const existingCodes = existingPermissions.map(p => p.code);
  const missingCodes = permissionsToGrant.filter(code => !existingCodes.includes(code));

  if (missingCodes.length > 0) {
      console.log(`Warning: The following permissions do not exist in the Permission table: ${missingCodes.join(', ')}`);
      // We could create them here if needed, but usually seed handles this.
  }

  // 4. Grant permissions to Role
  for (const perm of existingPermissions) {
      const exists = await prisma.rolePermission.findFirst({
          where: {
              roleId: agentRole.id,
              permissionId: perm.id
          }
      });

      if (!exists) {
          await prisma.rolePermission.create({
              data: {
                  roleId: agentRole.id,
                  permissionId: perm.id
              }
          });
          console.log(`Granted ${perm.code} to ${agentRole.name}`);
      } else {
          console.log(`Role ${agentRole.name} already has ${perm.code}`);
      }
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
