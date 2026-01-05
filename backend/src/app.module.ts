import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CallsModule } from './calls/calls.module';
import { DispositionsModule } from './dispositions/dispositions.module';
import { BulkUploadModule } from './bulk-upload/bulk-upload.module';
import { RbacModule } from './rbac/rbac.module';
import { ReportsModule } from './reports/reports.module';
import { VicidialModule } from './vicidial/vicidial.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { Phase4SecurityModule } from './common/phase4-security.module';
import { TasksModule } from './tasks/tasks.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { AppController } from './app.controller';
import { RootController } from './root.controller';
import SecurityHeadersMiddleware from './common/middleware/security-headers.middleware';
import { IpWhitelistMiddleware } from './common/middleware/ip-whitelist.middleware';
import { SettingsModule } from './settings/settings.module';
import { EventsModule } from './events/events.module';
import { CronModule } from './cron/cron.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes default TTL
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get('THROTTLE_TTL') || 60000,
          limit: configService.get('THROTTLE_LIMIT') || 10,
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    CallsModule,
    DispositionsModule,
    BulkUploadModule,
    TasksModule,
    CampaignsModule,
    RbacModule,
    ReportsModule,
    VicidialModule,
    EventsModule,
    Phase4SecurityModule,
    Phase4SecurityModule,
    SettingsModule,
    CronModule,
  ],
  controllers: [AppController, RootController],
  providers: [SecurityHeadersMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*'); // Apply to all routes

    consumer
      .apply(IpWhitelistMiddleware)
      .forRoutes('*');
  }
}