import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { TemplateService } from './template.service';
import { EmailController } from './email.controller';

@Module({
  imports: [
    // Register Bull queue for email processing
    BullModule.registerQueueAsync({
      name: 'email',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_EMAIL_QUEUE_DB', 2), // Separate DB for email queue
        },
        defaultJobOptions: {
          removeOnComplete: {
            age: 7 * 24 * 60 * 60, // Keep completed jobs for 7 days
            count: 1000, // Keep last 1000 completed jobs
          },
          removeOnFail: {
            age: 30 * 24 * 60 * 60, // Keep failed jobs for 30 days
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, EmailProcessor, TemplateService],
  exports: [EmailService, TemplateService],
})
export class EmailModule {}
