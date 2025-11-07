import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { SanitizerService } from './sanitizer.service';
import { EmailService } from './email.service';
import { SentryService } from './sentry.service';
import { LoggerService } from './logger.service';
import { MobileSyncService } from './services/mobile-sync.service';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { ErrorTrackingFilter } from './filters/error-tracking.filter';
import { MobileController } from './controllers/mobile.controller';

@Global() // Make this module global so we don't need to import it everywhere
@Module({
  controllers: [MobileController],
  providers: [
    SanitizerService,
    EmailService,
    SentryService,
    LoggerService,
    MobileSyncService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorTrackingFilter,
    },
  ],
  exports: [
    SanitizerService,
    EmailService,
    SentryService,
    LoggerService,
    MobileSyncService,
  ],
})
export class CommonModule {}
