import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { CallsModule } from './calls/calls.module';
import { BulkUploadModule } from './bulk-upload/bulk-upload.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AppController } from './app.controller';
import { RootController } from './root.controller';
import SecurityHeadersMiddleware from './common/middleware/security-headers.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
    BulkUploadModule,
  ],
  controllers: [AppController, RootController],
  providers: [SecurityHeadersMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityHeadersMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}