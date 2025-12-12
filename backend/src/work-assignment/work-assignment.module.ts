import { Module } from '@nestjs/common';
import { WorkAssignmentController } from './work-assignment.controller';
import { WorkAssignmentService } from './work-assignment.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [PrismaModule, TasksModule],
  controllers: [WorkAssignmentController],
  providers: [WorkAssignmentService],
  exports: [WorkAssignmentService],
})
export class WorkAssignmentModule {}
