import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import {
  AssignTaskDto,
  StartTaskDto,
  CompleteTaskDto,
  UpdateTaskStatusDto,
} from './dto/task-actions.dto';
import { TaskStatus, Task } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, assignedById: string) {
    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        assignedById,
        assignedAt: createTaskDto.assignedToId ? new Date() : null,
        status: createTaskDto.assignedToId
          ? TaskStatus.ASSIGNED
          : TaskStatus.PENDING,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        activity: { select: { id: true, title: true } },
      },
    });

    // Update assigned user's workload
    if (createTaskDto.assignedToId) {
      await this.updateUserWorkload(createTaskDto.assignedToId);
    }

    // Create history entry
    await this.createHistory({
      taskId: task.id,
      userId: assignedById,
      action: 'created',
      newStatus: task.status,
      notes: `Task created and ${task.assignedToId && task.assignedTo ? 'assigned to ' + task.assignedTo.name : 'pending assignment'}`,
    });

    return task;
  }

  async findAll(filterDto: FilterTaskDto) {
    const {
      page = 1,
      limit = 20,
      dueDateFrom,
      dueDateTo,
      ...filters
    } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = { ...filters };

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate.gte = new Date(dueDateFrom);
      if (dueDateTo) where.dueDate.lte = new Date(dueDateTo);
    }

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              performanceScore: true,
            },
          },
          assignedBy: { select: { id: true, name: true, email: true } },
          company: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          activity: { select: { id: true, title: true } },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: tasks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            performanceScore: true,
            currentWorkload: true,
          },
        },
        assignedBy: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true, value: true } },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        activity: { select: { id: true, title: true, type: true } },
        taskHistory: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const existingTask = await this.prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const previousStatus = existingTask.status;
    const newStatus = updateTaskDto.status || previousStatus;

    const task = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        assignedBy: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    // Update workload if assignment changed
    if (
      updateTaskDto.assignedToId &&
      updateTaskDto.assignedToId !== existingTask.assignedToId
    ) {
      if (existingTask.assignedToId) {
        await this.updateUserWorkload(existingTask.assignedToId);
      }
      await this.updateUserWorkload(updateTaskDto.assignedToId);
    }

    // Create history entry
    await this.createHistory({
      taskId: id,
      userId,
      action: 'updated',
      previousStatus: previousStatus !== newStatus ? previousStatus : undefined,
      newStatus: previousStatus !== newStatus ? newStatus : undefined,
      notes: this.generateUpdateNotes(updateTaskDto),
    });

    return task;
  }

  async remove(id: string, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Update user workload before deletion
    if (task.assignedToId) {
      await this.updateUserWorkload(task.assignedToId);
    }

    await this.prisma.task.delete({ where: { id } });

    return { message: 'Task deleted successfully' };
  }

  async assignTask(id: string, assignDto: AssignTaskDto, assignedById: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        assignedToId: assignDto.assignedToId,
        assignedById,
        assignedAt: new Date(),
        status: TaskStatus.ASSIGNED,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    // Update workloads
    if (task.assignedToId) {
      await this.updateUserWorkload(task.assignedToId);
    }
    await this.updateUserWorkload(assignDto.assignedToId);

    // Create history
    await this.createHistory({
      taskId: id,
      userId: assignedById,
      action: 'assigned',
      previousStatus: task.status,
      newStatus: TaskStatus.ASSIGNED,
      notes: `Task assigned to ${updatedTask.assignedTo?.name || 'unknown'}`,
    });

    return updatedTask;
  }

  async startTask(id: string, startDto: StartTaskDto, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (task.assignedToId !== userId) {
      throw new ForbiddenException('You can only start tasks assigned to you');
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('Cannot start a completed task');
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
        startedAt: task.startedAt || new Date(),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    await this.createHistory({
      taskId: id,
      userId,
      action: 'started',
      previousStatus: task.status,
      newStatus: TaskStatus.IN_PROGRESS,
      notes: startDto.notes || 'Task started',
    });

    return updatedTask;
  }

  async completeTask(id: string, completeDto: CompleteTaskDto, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    if (task.assignedToId !== userId) {
      throw new ForbiddenException(
        'You can only complete tasks assigned to you',
      );
    }

    const completedAt = new Date();
    const isOnTime = task.dueDate ? completedAt <= task.dueDate : true;

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt,
        actualHours: completeDto.actualHours,
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    // Update user stats
    await this.updateUserStats(userId, isOnTime, completeDto.actualHours);
    await this.updateUserWorkload(userId);

    await this.createHistory({
      taskId: id,
      userId,
      action: 'completed',
      previousStatus: task.status,
      newStatus: TaskStatus.COMPLETED,
      hoursSpent: completeDto.actualHours,
      notes:
        completeDto.notes ||
        `Task completed in ${completeDto.actualHours} hours${isOnTime ? ' (On time)' : ' (Late)'}`,
    });

    return updatedTask;
  }

  async updateStatus(
    id: string,
    statusDto: UpdateTaskStatusDto,
    userId: string,
  ) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    const updatedTask = await this.prisma.task.update({
      where: { id },
      data: { status: statusDto.status },
      include: {
        assignedTo: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    await this.createHistory({
      taskId: id,
      userId,
      action: 'status_changed',
      previousStatus: task.status,
      newStatus: statusDto.status,
      hoursSpent: statusDto.hoursSpent,
      notes: statusDto.notes,
    });

    return updatedTask;
  }

  async getTaskHistory(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.prisma.taskHistory.findMany({
      where: { taskId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Helper methods
  private async createHistory(data: {
    taskId: string;
    userId: string;
    action: string;
    previousStatus?: TaskStatus;
    newStatus?: TaskStatus;
    hoursSpent?: number;
    notes?: string;
  }) {
    await this.prisma.taskHistory.create({ data });
  }

  private async updateUserWorkload(userId: string) {
    const activeTasksCount = await this.prisma.task.count({
      where: {
        assignedToId: userId,
        status: {
          in: [
            TaskStatus.ASSIGNED,
            TaskStatus.IN_PROGRESS,
            TaskStatus.BLOCKED,
            TaskStatus.REVIEW,
          ],
        },
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { currentWorkload: activeTasksCount },
    });
  }

  private async updateUserStats(
    userId: string,
    isOnTime: boolean,
    actualHours: number,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newTotalCompleted = user.totalTasksCompleted + 1;
    const onTimeCount = isOnTime ? 1 : 0;
    const newOnTimeRate =
      (user.onTimeCompletionRate * user.totalTasksCompleted +
        onTimeCount * 100) /
      newTotalCompleted;

    // Calculate new average completion time
    const currentAvg = user.averageCompletionTime || 0;
    const newAvg =
      (currentAvg * user.totalTasksCompleted + actualHours) / newTotalCompleted;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalTasksCompleted: newTotalCompleted,
        onTimeCompletionRate: newOnTimeRate,
        averageCompletionTime: newAvg,
      },
    });
  }

  private generateUpdateNotes(updateDto: UpdateTaskDto): string {
    const changes: string[] = [];
    if (updateDto.title) changes.push('title');
    if (updateDto.status) changes.push('status');
    if (updateDto.priority) changes.push('priority');
    if (updateDto.assignedToId) changes.push('assignee');
    return `Updated: ${changes.join(', ')}`;
  }
}
