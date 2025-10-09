import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import { PermissionCacheService } from '../services/permission-cache.service';
import { RateLimitingService } from '../services/rate-limiting.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditLoggingService } from '../services/audit-logging.service';

@Global()
@Module({
  imports: [
    PrismaModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisConfig = {
          store: redisStore as any,
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
          ttl: configService.get('CACHE_TTL', 900), // 15 minutes default
          max: configService.get('CACHE_MAX_ITEMS', 10000),
          // Redis connection options
          retryAttempts: 3,
          retryDelay: 1000,
          connectTimeout: 10000,
          commandTimeout: 5000,
          lazyConnect: true,
          // Enable compression for large cache values
          compression: 'gzip',
          // Connection pool settings
          family: 4,
          keepAlive: true,
          // Error handling
          showFriendlyErrorStack: true,
        };

        // If Redis is not available, fall back to in-memory cache
        try {
          return redisConfig;
        } catch (error) {
          console.warn('Redis not available, falling back to in-memory cache:', error);
          return {
            ttl: configService.get('CACHE_TTL', 900),
            max: configService.get('CACHE_MAX_ITEMS', 1000), // Smaller for memory
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuditLoggingService,
    PermissionCacheService,
    RateLimitingService,
  ],
  exports: [
    CacheModule,
    AuditLoggingService,
    PermissionCacheService,
    RateLimitingService,
  ],
})
export class CacheConfigModule {}