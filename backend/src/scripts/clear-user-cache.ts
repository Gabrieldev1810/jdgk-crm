
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PermissionCacheService } from '../common/services/permission-cache.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const cacheService = app.get(PermissionCacheService);
  const userId = 'a380373b-a808-419a-9117-00f3b546de4e'; // Admin ID

  console.log('Invalidating cache for user...');
  await cacheService.invalidateUserCache(userId, 'Manual debug invalidation');
  console.log('Cache invalidated.');

  await app.close();
}

main().catch(console.error);
