import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ExportController],
  providers: [ExportService, ImportService, PrismaService],
  exports: [ExportService, ImportService],
})
export class ExportModule {}
