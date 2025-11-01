import { Module } from '@nestjs/common';
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
import { HealthModule } from './health/health.module';
import { SentryService } from './common/sentry.service';
import { GlobalExceptionFilter } from './common/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Global rate limiting: 100 req/min in production, 200 req/min in dev
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: 60000, // 1 minute
            limit:
              configService.get('NODE_ENV') === 'production' ? 100 : 200, // 200 req/min in dev for hot-reload
          },
        ],
      }),
    }),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    DealsModule,
    ContactsModule,
    ActivitiesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SentryService,
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
export class AppModule {}
