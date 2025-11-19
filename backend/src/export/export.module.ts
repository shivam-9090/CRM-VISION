import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportJobService } from './export-job.service';
import { ExportTemplateService } from './export-template.service';
import { ExportStreamingService } from './export-streaming.service';
import { ExportProcessor } from './export.processor';
import { FileStorageService } from './file-storage.service';
import { ImportService } from './import.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'export',
    }),
    EmailModule,
  ],
  controllers: [ExportController],
  providers: [
    ExportService,
    ExportJobService,
    ExportTemplateService,
    ExportStreamingService,
    ExportProcessor,
    FileStorageService,
    ImportService,
    PrismaService,
  ],
  exports: [
    ExportService,
    ExportJobService,
    ExportTemplateService,
    ExportStreamingService,
    FileStorageService,
    ImportService,
  ],
})
export class ExportModule {}
