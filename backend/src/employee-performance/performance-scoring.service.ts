import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskStatus } from '@prisma/client';

interface ScoreFactors {
  completionRate: number;
  onTimeRate: number;
  averageSpeed: number;
  taskQuality: number;
  workloadBalance: number;
}

@Injectable()
export class PerformanceScoringService {
  private readonly logger = new Logger(PerformanceScoringService.name);

  // Weights for performance score calculation (total = 1.0)
  private readonly WEIGHTS = {
    completionRate: 0.30,    // 30% - Tasks completed vs assigned
    onTimeRate: 0.25,        // 25% - On-time delivery rate
    averageSpeed: 0.20,      // 20% - Speed compared to estimates
    taskQuality: 0.15,       // 15% - Quality score from reviews
    workloadBalance: 0.10,   // 10% - Workload management
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate comprehensive performance score for an employee (0-100)
   */
  async calculatePerformanceScore(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          where: {
            status: {
              in: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
            },
          },
        },
        performanceReviews: {
          orderBy: { createdAt: 'desc' },
          take: 5, // Last 5 reviews
        },
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // If no tasks assigned yet, return default score
    if (user.totalTasksAssigned === 0) {
      return 50.0;
    }

    const factors = await this.calculateScoreFactors(user);

    // Calculate weighted score
    const finalScore =
      factors.completionRate * this.WEIGHTS.completionRate +
      factors.onTimeRate * this.WEIGHTS.onTimeRate +
      factors.averageSpeed * this.WEIGHTS.averageSpeed +
      factors.taskQuality * this.WEIGHTS.taskQuality +
      factors.workloadBalance * this.WEIGHTS.workloadBalance;

    // Ensure score is between 0 and 100
    return Math.min(100, Math.max(0, finalScore));
  }

  /**
   * Calculate individual score factors
   */
  private async calculateScoreFactors(user: any): Promise<ScoreFactors> {
    // 1. Completion Rate (0-100)
    const completionRate =
      user.totalTasksAssigned > 0
        ? (user.totalTasksCompleted / user.totalTasksAssigned) * 100
        : 50;

    // 2. On-Time Rate (0-100) - Already stored as percentage
    const onTimeRate = user.onTimeCompletionRate;

    // 3. Average Speed Score (0-100)
    // Compare actual hours vs estimated hours
    const speedScore = await this.calculateSpeedScore(user.id);

    // 4. Task Quality Score (0-100)
    // Based on recent performance reviews
    const qualityScore = this.calculateQualityScore(user.performanceReviews);

    // 5. Workload Balance Score (0-100)
    const workloadScore = this.calculateWorkloadScore(
      user.currentWorkload,
      user.workCapacity,
    );

    return {
      completionRate,
      onTimeRate,
      averageSpeed: speedScore,
      taskQuality: qualityScore,
      workloadBalance: workloadScore,
    };
  }

  /**
   * Calculate speed score based on actual vs estimated hours
   */
  private async calculateSpeedScore(userId: string): Promise<number> {
    const completedTasks = await this.prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: TaskStatus.COMPLETED,
        estimatedHours: { not: null },
        actualHours: { not: null },
      },
      select: {
        estimatedHours: true,
        actualHours: true,
      },
      take: 50, // Last 50 completed tasks
    });

    if (completedTasks.length === 0) {
      return 50; // Default score if no data
    }

    // Calculate speed ratio for each task
    const speedRatios = completedTasks.map((task) => {
      const ratio = task.estimatedHours / task.actualHours;
      // ratio > 1 means completed faster than estimated (good)
      // ratio < 1 means took longer than estimated (bad)
      return Math.min(2, Math.max(0, ratio)); // Cap between 0 and 2
    });

    // Average speed ratio
    const avgRatio = speedRatios.reduce((a, b) => a + b, 0) / speedRatios.length;

    // Convert to score (0-100)
    // 1.0 ratio = 75 score (completed on time)
    // 1.5 ratio = 100 score (50% faster)
    // 0.5 ratio = 50 score (50% slower)
    return Math.min(100, Math.max(0, avgRatio * 75));
  }

  /**
   * Calculate quality score from performance reviews
   */
  private calculateQualityScore(reviews: any[]): number {
    if (reviews.length === 0) {
      return 70; // Default quality score
    }

    // Average quality scores from recent reviews
    const avgQuality =
      reviews.reduce((sum, review) => sum + review.qualityScore, 0) /
      reviews.length;

    // Quality score is already 0-10, multiply by 10 to get 0-100
    return avgQuality * 10;
  }

  /**
   * Calculate workload balance score
   */
  private calculateWorkloadScore(
    currentWorkload: number,
    workCapacity: number,
  ): number {
    if (workCapacity === 0) {
      return 50; // Default if capacity not set
    }

    const utilizationRate = currentWorkload / workCapacity;

    // Optimal utilization is 60-80%
    // Score drops if overworked (>100%) or underutilized (<40%)
    if (utilizationRate >= 0.6 && utilizationRate <= 0.8) {
      return 100; // Optimal range
    } else if (utilizationRate < 0.6) {
      // Underutilized: score 50-100
      return 50 + utilizationRate * 83.33;
    } else if (utilizationRate <= 1.0) {
      // Near capacity: score 80-100
      return 100 - (utilizationRate - 0.8) * 100;
    } else {
      // Overworked: score decreases sharply
      return Math.max(0, 100 - (utilizationRate - 1.0) * 200);
    }
  }

  /**
   * Get detailed performance breakdown
   */
  async getPerformanceBreakdown(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        performanceReviews: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const factors = await this.calculateScoreFactors(user);
    const totalScore = await this.calculatePerformanceScore(userId);

    return {
      userId: user.id,
      userName: user.name,
      totalScore,
      breakdown: {
        completionRate: {
          value: factors.completionRate,
          weight: this.WEIGHTS.completionRate * 100,
          contribution: factors.completionRate * this.WEIGHTS.completionRate,
          description: `${user.totalTasksCompleted} of ${user.totalTasksAssigned} tasks completed`,
        },
        onTimeRate: {
          value: factors.onTimeRate,
          weight: this.WEIGHTS.onTimeRate * 100,
          contribution: factors.onTimeRate * this.WEIGHTS.onTimeRate,
          description: `${factors.onTimeRate.toFixed(1)}% delivered on time`,
        },
        averageSpeed: {
          value: factors.averageSpeed,
          weight: this.WEIGHTS.averageSpeed * 100,
          contribution: factors.averageSpeed * this.WEIGHTS.averageSpeed,
          description: user.averageCompletionTime
            ? `Average ${user.averageCompletionTime.toFixed(1)} hours per task`
            : 'No data yet',
        },
        taskQuality: {
          value: factors.taskQuality,
          weight: this.WEIGHTS.taskQuality * 100,
          contribution: factors.taskQuality * this.WEIGHTS.taskQuality,
          description: `Quality score from ${user.performanceReviews.length} recent reviews`,
        },
        workloadBalance: {
          value: factors.workloadBalance,
          weight: this.WEIGHTS.workloadBalance * 100,
          contribution: factors.workloadBalance * this.WEIGHTS.workloadBalance,
          description: `${user.currentWorkload} of ${user.workCapacity} capacity used`,
        },
      },
      stats: {
        totalTasksAssigned: user.totalTasksAssigned,
        totalTasksCompleted: user.totalTasksCompleted,
        currentWorkload: user.currentWorkload,
        workCapacity: user.workCapacity,
        onTimeCompletionRate: user.onTimeCompletionRate,
        averageCompletionTime: user.averageCompletionTime,
      },
    };
  }

  /**
   * Recalculate and update performance scores for all employees
   * Runs daily at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async recalculateAllScores() {
    this.logger.log('Starting daily performance score recalculation...');

    const employees = await this.prisma.user.findMany({
      where: {
        role: { in: ['EMPLOYEE', 'SALES'] },
      },
      select: { id: true, name: true },
    });

    let successCount = 0;
    let errorCount = 0;

    for (const employee of employees) {
      try {
        const newScore = await this.calculatePerformanceScore(employee.id);
        await this.prisma.user.update({
          where: { id: employee.id },
          data: { performanceScore: newScore },
        });
        successCount++;
        this.logger.debug(
          `Updated score for ${employee.name}: ${newScore.toFixed(2)}`,
        );
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Failed to update score for ${employee.name}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Performance score recalculation complete: ${successCount} success, ${errorCount} errors`,
    );
  }

  /**
   * Manually trigger score recalculation for a specific employee
   */
  async recalculateEmployeeScore(userId: string): Promise<number> {
    const newScore = await this.calculatePerformanceScore(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { performanceScore: newScore },
    });
    return newScore;
  }
}
