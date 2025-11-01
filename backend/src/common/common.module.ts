import { Module, Global } from '@nestjs/common';
import { SanitizerService } from './sanitizer.service';
import { EmailService } from './email.service';
import { SentryService } from './sentry.service';

@Global() // Make this module global so we don't need to import it everywhere
@Module({
  providers: [SanitizerService, EmailService, SentryService],
  exports: [SanitizerService, EmailService, SentryService],
})
export class CommonModule {}
