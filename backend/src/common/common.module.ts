import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { SanitizerService } from './sanitizer.service';
import { EmailService } from './email.service';
import { SentryService } from './sentry.service';
import { LoggerService } from './logger.service';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { ErrorTrackingFilter } from './filters/error-tracking.filter';

@Global() // Make this module global so we don't need to import it everywhere
@Module({
  providers: [
    SanitizerService,
    EmailService,
    SentryService,
    LoggerService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PerformanceInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorTrackingFilter,
    },
  ],
  exports: [SanitizerService, EmailService, SentryService, LoggerService],
})
export class CommonModule {}
