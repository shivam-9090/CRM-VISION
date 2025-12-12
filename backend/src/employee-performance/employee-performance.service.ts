import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PerformanceScoringService } from './performance-scoring.service';
import { CreatePerformanceReviewDto, UpdateSkillsDto, UpdateWorkCapacityDto } from './dto/performance.dto';

@Injectable()
export class EmployeePerformanceService {
  constructor(
    private prisma: PrismaService,
    private scoringService: PerformanceScoringService,
  ) {}

  /**
   * Get all employees with performance metrics
   */
  async getAllEmployees(companyId?: string) {
    const where: any = {
      role: { in: ['EMPLOYEE', 'SALES', 'MANAGER'] },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    const employees = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        performanceScore: true,
        skillTags: true,
        workCapacity: true,
        currentWorkload: true,
        totalTasksCompleted: true,
        totalTasksAssigned: true,
        onTimeCompletionRate: true,
        averageCompletionTime: true,
        createdAt: true,
      },
      orderBy: { performanceScore: 'desc' },
    });

    return employees.map((emp) => ({
      ...emp,
      utilizationRate: emp.workCapacity > 0 ? (emp.currentWorkload / emp.workCapacity) * 100 : 0,
      completionRate:
        emp.totalTasksAssigned > 0
          ? (emp.totalTasksCompleted / emp.totalTasksAssigned) * 100
          : 0,
    }));
  }

  /**
   * Get detailed performance metrics for a specific employee
   */
  async getEmployeePerformance(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            company: { select: { id: true, name: true } },
            deal: { select: { id: true, title: true } },
          },
        },
        performanceReviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Employee with ID ${userId} not found`);
    }

    // Get detailed score breakdown
    const breakdown = await this.scoringService.getPerformanceBreakdown(userId);

    return {
      employee: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        skillTags: user.skillTags,
      },
      performance: breakdown,
      recentTasks: user.assignedTasks,
      reviews: user.performanceReviews,
    };
  }

  /**
   * Get employee task history with detailed analytics
   */
  async getEmployeeTaskHistory(userId: string, limit = 50) {
    const tasks = await this.prisma.task.findMany({
      where: { assignedToId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        taskHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Calculate analytics
    const completed = tasks.filter((t) => t.status === 'COMPLETED');
    const onTime = completed.filter((t) => t.dueDate && t.completedAt && t.completedAt <= t.dueDate);

    return {
      tasks,
      analytics: {
        totalTasks: tasks.length,
        completedTasks: completed.length,
        onTimeDeliveries: onTime.length,
        completionRate: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
        onTimeRate: completed.length > 0 ? (onTime.length / completed.length) * 100 : 0,
      },
    };
  }

  /**
   * Create a performance review
   */
  async createPerformanceReview(reviewDto: CreatePerformanceReviewDto, reviewedById: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: reviewDto.userId },
    });

    if (!user) {
      throw new NotFoundException(`Employee with ID ${reviewDto.userId} not found`);
    }

    // Calculate metrics for the review period
    const tasks = await this.prisma.task.findMany({
      where: {
        assignedToId: reviewDto.userId,
        status: 'COMPLETED',
        completedAt: {
          gte: new Date(reviewDto.reviewPeriodStart),
          lte: new Date(reviewDto.reviewPeriodEnd),
        },
      },
    });

    const onTimeCount = tasks.filter(
      (t) => t.dueDate && t.completedAt && t.completedAt <= t.dueDate,
    ).length;

    const avgTime =
      tasks.length > 0
        ? tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0) / tasks.length
        : 0;

    const review = await this.prisma.performanceReview.create({
      data: {
        userId: reviewDto.userId,
        reviewPeriodStart: new Date(reviewDto.reviewPeriodStart),
        reviewPeriodEnd: new Date(reviewDto.reviewPeriodEnd),
        tasksCompleted: tasks.length,
        averageCompletionTime: avgTime,
        onTimeRate: tasks.length > 0 ? (onTimeCount / tasks.length) * 100 : 0,
        qualityScore: reviewDto.qualityScore,
        performanceScore: user.performanceScore,
        reviewedById,
        reviewNotes: reviewDto.reviewNotes,
        strengths: reviewDto.strengths ? JSON.parse(JSON.stringify(reviewDto.strengths)) : null,
        improvements: reviewDto.improvements ? JSON.parse(JSON.stringify(reviewDto.improvements)) : null,
      },
    });

    // Trigger score recalculation
    await this.scoringService.recalculateEmployeeScore(reviewDto.userId);

    return review;
  }

  /**
   * Update employee skills
   */
  async updateEmployeeSkills(userId: string, skillsDto: UpdateSkillsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Employee with ID ${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        skillTags: JSON.parse(JSON.stringify(skillsDto.skillTags)),
      },
    });
  }

  /**
   * Update employee work capacity
   */
  async updateWorkCapacity(userId: string, capacityDto: UpdateWorkCapacityDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Employee with ID ${userId} not found`);
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { workCapacity: capacityDto.workCapacity },
    });

    // Recalculate score as workload balance changed
    await this.scoringService.recalculateEmployeeScore(userId);

    return updated;
  }

  /**
   * Get leaderboard of top performers
   */
  async getLeaderboard(companyId?: string, limit = 10) {
    const where: any = {
      role: { in: ['EMPLOYEE', 'SALES'] },
      totalTasksAssigned: { gt: 0 },
    };

    if (companyId) {
      where.companyId = companyId;
    }

    const topPerformers = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        performanceScore: true,
        totalTasksCompleted: true,
        onTimeCompletionRate: true,
        averageCompletionTime: true,
      },
      orderBy: { performanceScore: 'desc' },
      take: limit,
    });

    return topPerformers.map((user, index) => ({
      rank: index + 1,
      ...user,
    }));
  }

  /**
   * Manually trigger score recalculation for an employee
   */
  async recalculateScore(userId: string) {
    const newScore = await this.scoringService.recalculateEmployeeScore(userId);
    return {
      userId,
      newScore,
      message: 'Performance score recalculated successfully',
    };
  }
}
