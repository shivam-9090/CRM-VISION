import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EmployeePerformanceController } from './employee-performance.controller';
import { EmployeePerformanceService } from './employee-performance.service';
import { PerformanceScoringService } from './performance-scoring.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(), // Enable cron jobs
  ],
  controllers: [EmployeePerformanceController],
  providers: [EmployeePerformanceService, PerformanceScoringService],
  exports: [EmployeePerformanceService, PerformanceScoringService],
})
export class EmployeePerformanceModule {}
