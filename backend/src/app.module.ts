import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
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
import { EmailModule } from './email/email.module';
import { CalendarModule } from './calendar/calendar.module';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import { RedisModule } from './redis/redis.module';
import { CommonModule } from './common/common.module';
import { RedisThrottlerStorage } from './common/redis-throttler.storage';
import { RateLimitHeadersMiddleware } from './common/middlewares/rate-limit-headers.middleware';
import { ForceHttpsMiddleware } from './common/middlewares/force-https.middleware';
import { QueryPerformanceInterceptor } from './common/interceptors/query-performance.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Bull queue infrastructure (Redis-based job queue)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
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
    CommonModule, // Global module with SanitizerService, SentryService, LoggerService
    EmailModule, // Email queue with templates, retries, and delivery tracking
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
    CalendarModule,
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
    {
      provide: APP_INTERCEPTOR,
      useClass: QueryPerformanceInterceptor, // Global query performance monitoring
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Force HTTPS in production (must be first middleware)
    consumer.apply(ForceHttpsMiddleware).forRoutes('*');

    // Apply rate limit headers middleware to all routes
    consumer.apply(RateLimitHeadersMiddleware).forRoutes('*');
  }
}
