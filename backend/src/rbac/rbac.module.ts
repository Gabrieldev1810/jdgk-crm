import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RbacMinimalService } from './rbac-minimal.service';
import { RbacController } from './rbac.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PrivilegeEscalationService } from '../auth/services/privilege-escalation.service';
import { AuditLoggingService } from '../common/services/audit-logging.service';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { CacheConfigModule } from '../common/cache/cache-config.module';
import { PermissionCacheService } from '../common/services/permission-cache.service';
import { RateLimitingService } from '../common/services/rate-limiting.service';

@Module({
  imports: [
    PrismaModule,
    CacheConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [RbacController],
  providers: [
    RbacMinimalService, 
    PermissionsGuard, 
    PrivilegeEscalationService,
    AuditLoggingService,
    AuditInterceptor,
    PermissionCacheService,
    RateLimitingService
  ],
  exports: [
    RbacMinimalService, 
    PermissionsGuard, 
    PrivilegeEscalationService, 
    AuditLoggingService,
    PermissionCacheService,
    RateLimitingService
  ],
})
export class RbacModule {}