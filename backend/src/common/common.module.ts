import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLoggingService } from './services/audit-logging.service';
import { PermissionCacheService } from './services/permission-cache.service';

@Module({
  imports: [PrismaModule],
  providers: [
    AuditLoggingService,
    PermissionCacheService,
  ],
  exports: [
    AuditLoggingService,
    PermissionCacheService,
  ],
})
export class CommonModule {}