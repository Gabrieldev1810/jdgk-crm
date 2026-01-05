
import { PrismaClient } from '@prisma/client';
import { CacheModule } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { PermissionCacheService } from '../common/services/permission-cache.service';
import { AuditLoggingService } from '../common/services/audit-logging.service';
import { PrismaService } from '../prisma/prisma.service';

async function main() {
  const prisma = new PrismaClient();
  const userId = 'a380373b-a808-419a-9117-00f3b546de4e'; // Admin ID

  console.log('Clearing cache for user...');
  // We can't easily clear the cache service's cache from here without instantiating the full Nest app,
  // but we can verify what the DB returns, which is what the cache service falls back to.

  console.log('Fetching permissions from DB...');
  const userRoles = await prisma.userRole.findMany({
    where: { 
      userId,
      isActive: true,
    },
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
  });

  const permissions = userRoles.flatMap(ur =>
    ur.role.permissions.map(rp => rp.permission.code)
  );
  const uniquePermissions = [...new Set(permissions)];

  console.log(`Found ${uniquePermissions.length} permissions for user.`);
  console.log('Has rbac.view?', uniquePermissions.includes('rbac.view'));
  
  if (!uniquePermissions.includes('rbac.view')) {
      console.log('WARNING: User missing rbac.view permission!');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
