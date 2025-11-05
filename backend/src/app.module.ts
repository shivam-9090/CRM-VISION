import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './company/companies.module';
import { DealsModule } from './deals/deals.module';
import { ContactsModule } from './contacts/contacts.module';
import { ActivitiesModule } from './activities/activities.module';
import { UserModule } from './user/user.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SearchModule } from './search/search.module';
import { ExportModule } from './export/export.module';
import { CommentsModule } from './comments/comments.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { RedisModule } from './redis/redis.module';
import { CommonModule } from './common/common.module';
import { RedisThrottlerStorage } from './common/redis-throttler.storage';
import { RateLimitHeadersMiddleware } from './common/middlewares/rate-limit-headers.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Global rate limiting with Redis-based storage
    // Development: 200 req/min (in-memory fallback)
    // Production: 100 req/min (Redis sliding window)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000, // 1 minute (60,000 ms)
            limit: configService.get('NODE_ENV') === 'production' ? 100 : 200,
          },
          {
            name: 'short',
            ttl: 10000, // 10 seconds for burst protection
            limit: 20,
          },
          {
            name: 'long',
            ttl: 3600000, // 1 hour for API quotas
            limit: 1000,
          },
        ],
        storage: new RedisThrottlerStorage(configService),
      }),
    }),
    RedisModule,
    CommonModule, // Global module with SanitizerService, EmailService, SentryService
    PrismaModule,
    AuthModule,
    CompaniesModule,
    DealsModule,
    ContactsModule,
    ActivitiesModule,
    UserModule,
    AnalyticsModule,
    SearchModule,
    ExportModule,
    CommentsModule,
    AuditLogModule,
    AttachmentsModule,
    NotificationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Global rate limiting on all endpoints
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter, // Global exception handling with Sentry
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply rate limit headers middleware to all routes
    consumer.apply(RateLimitHeadersMiddleware).forRoutes('*');
  }
}
