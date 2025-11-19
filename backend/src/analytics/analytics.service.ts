import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Convert Prisma Decimal to number
   */
  private toNumber(value: number | Decimal | null): number {
    if (value === null) return 0;
    if (typeof value === 'number') return value;
    return value.toNumber();
  }

  /**
   * Get sales pipeline statistics by stage
   * Returns deal counts and total values for each pipeline stage
   */
  async getPipelineStats(companyId: string) {
    // Get all deals for the company
    const deals = await this.prisma.deal.findMany({
      where: { companyId },
      select: {
        stage: true,
        value: true,
      },
    });

    // Group by stage
    const statsByStage = deals.reduce(
      (acc, deal) => {
        const stage = deal.stage;
        if (!acc[stage]) {
          acc[stage] = {
            stage,
            count: 0,
            totalValue: 0,
          };
        }
        acc[stage].count += 1;
        acc[stage].totalValue += this.toNumber(deal.value);
        return acc;
      },
      {} as Record<
        string,
        { stage: string; count: number; totalValue: number }
      >,
    );

    // Convert to array and calculate totals
    const pipeline = Object.values(statsByStage);
    const totalDeals = deals.length;
    const totalValue = deals.reduce(
      (sum, deal) => sum + this.toNumber(deal.value),
      0,
    );

    return {
      pipeline,
      summary: {
        totalDeals,
        totalValue,
        averageDealValue: totalDeals > 0 ? totalValue / totalDeals : 0,
      },
    };
  }

  /**
   * Get revenue forecasting data
   * Returns monthly and quarterly revenue projections based on deal stages
   */
  async getRevenueForecast(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(
      now.getFullYear(),
      Math.floor(now.getMonth() / 3) * 3,
      1,
    );

    // Get deals created this month and quarter
    const [monthlyDeals, quarterlyDeals, allActiveDeals] = await Promise.all([
      this.prisma.deal.findMany({
        where: {
          companyId,
          createdAt: { gte: startOfMonth },
        },
        select: { value: true, stage: true, expectedCloseDate: true },
      }),
      this.prisma.deal.findMany({
        where: {
          companyId,
          createdAt: { gte: startOfQuarter },
        },
        select: { value: true, stage: true, expectedCloseDate: true },
      }),
      this.prisma.deal.findMany({
        where: {
          companyId,
          stage: { notIn: ['CLOSED_LOST'] },
        },
        select: { value: true, stage: true, expectedCloseDate: true },
      }),
    ]);

    // Calculate weighted revenue (probability by stage)
    const stageWeights: Record<string, number> = {
      LEAD: 0.1,
      QUALIFIED: 0.25,
      NEGOTIATION: 0.75,
      CLOSED_WON: 1.0,
      CLOSED_LOST: 0,
    };

    const calculateWeightedRevenue = (
      deals: Array<{
        value: number | Decimal | null;
        stage: string;
        expectedCloseDate: Date | null;
      }>,
    ): number => {
      return deals.reduce((sum, deal) => {
        const weight = stageWeights[deal.stage] || 0;
        return sum + this.toNumber(deal.value) * weight;
      }, 0);
    };

    const monthlyRevenue = calculateWeightedRevenue(monthlyDeals);
    const quarterlyRevenue = calculateWeightedRevenue(quarterlyDeals);
    const projectedRevenue = calculateWeightedRevenue(allActiveDeals);

    // Group by expected close month
    const revenueByMonth = allActiveDeals.reduce(
      (acc, deal) => {
        if (!deal.expectedCloseDate) return acc;

        const monthKey = new Date(deal.expectedCloseDate)
          .toISOString()
          .slice(0, 7); // YYYY-MM
        if (!acc[monthKey]) {
          acc[monthKey] = 0;
        }
        const weight = stageWeights[deal.stage] || 0;
        acc[monthKey] += this.toNumber(deal.value) * weight;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      monthly: {
        actual: monthlyRevenue,
        projected: monthlyRevenue * 1.2, // Simple 20% growth projection
      },
      quarterly: {
        actual: quarterlyRevenue,
        projected: quarterlyRevenue * 1.2,
      },
      projectedRevenue,
      revenueByMonth: Object.entries(revenueByMonth)
        .map(([month, revenue]) => ({ month, revenue }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  }

  /**
   * Get activity completion statistics
   * Returns completion rates and overdue activities
   */
  async getActivityStats(companyId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all activities for the company
    const [allActivities, monthlyActivities] = await Promise.all([
      this.prisma.activity.findMany({
        where: { companyId },
        select: {
          status: true,
          scheduledDate: true,
          type: true,
        },
      }),
      this.prisma.activity.findMany({
        where: {
          companyId,
          createdAt: { gte: startOfMonth },
        },
        select: {
          status: true,
          scheduledDate: true,
          type: true,
        },
      }),
    ]);

    // Calculate completion rates
    const totalActivities = allActivities.length;
    const completedActivities = allActivities.filter(
      (a) => a.status === 'COMPLETED',
    ).length;
    const scheduledActivities = allActivities.filter(
      (a) => a.status === 'SCHEDULED',
    ).length;
    const cancelledActivities = allActivities.filter(
      (a) => a.status === 'CANCELLED',
    ).length;

    const completionRate =
      totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

    // Find overdue activities
    const overdueActivities = allActivities.filter(
      (a) =>
        a.status === 'SCHEDULED' &&
        a.scheduledDate &&
        new Date(a.scheduledDate) < now,
    ).length;

    // Group by type
    const byType = allActivities.reduce(
      (acc, activity) => {
        const type = activity.type;
        if (!acc[type]) {
          acc[type] = {
            type,
            total: 0,
            completed: 0,
            scheduled: 0,
          };
        }
        acc[type].total += 1;
        if (activity.status === 'COMPLETED') acc[type].completed += 1;
        if (activity.status === 'SCHEDULED') acc[type].scheduled += 1;
        return acc;
      },
      {} as Record<string, any>,
    );

    // Monthly stats
    const monthlyCompleted = monthlyActivities.filter(
      (a) => a.status === 'COMPLETED',
    ).length;
    const monthlyTotal = monthlyActivities.length;
    const monthlyCompletionRate =
      monthlyTotal > 0 ? (monthlyCompleted / monthlyTotal) * 100 : 0;

    return {
      overall: {
        total: totalActivities,
        completed: completedActivities,
        scheduled: scheduledActivities,
        cancelled: cancelledActivities,
        overdue: overdueActivities,
        completionRate: Math.round(completionRate * 100) / 100,
      },
      monthly: {
        total: monthlyTotal,
        completed: monthlyCompleted,
        completionRate: Math.round(monthlyCompletionRate * 100) / 100,
      },
      byType: Object.values(byType),
    };
  }

  /**
   * Get team performance metrics
   * Returns activity and deal statistics by user
   */
  async getTeamPerformance(companyId: string) {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    // Get all users in the company
    const users = await this.prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Get activities and deals for each user
    const userStats = await Promise.all(
      users.map(async (user) => {
        const [activities, monthlyActivities, deals, monthlyDeals] =
          await Promise.all([
            this.prisma.activity.count({
              where: {
                companyId,
                assignedToId: user.id,
              },
            }),
            this.prisma.activity.count({
              where: {
                companyId,
                assignedToId: user.id,
                createdAt: { gte: startOfMonth },
              },
            }),
            this.prisma.deal.findMany({
              where: {
                companyId,
                assignedToId: user.id,
              },
              select: {
                value: true,
                stage: true,
              },
            }),
            this.prisma.deal.findMany({
              where: {
                companyId,
                assignedToId: user.id,
                createdAt: { gte: startOfMonth },
              },
              select: {
                value: true,
                stage: true,
              },
            }),
          ]);

        const totalDealValue = deals.reduce(
          (sum, deal) => sum + this.toNumber(deal.value),
          0,
        );
        const wonDeals = deals.filter((d) => d.stage === 'CLOSED_WON').length;
        const monthlyDealValue = monthlyDeals.reduce(
          (sum, deal) => sum + this.toNumber(deal.value),
          0,
        );

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          activities: {
            total: activities,
            thisMonth: monthlyActivities,
          },
          deals: {
            total: deals.length,
            won: wonDeals,
            totalValue: totalDealValue,
            thisMonth: monthlyDeals.length,
            monthlyValue: monthlyDealValue,
          },
        };
      }),
    );

    // Sort by monthly deal value
    userStats.sort((a, b) => b.deals.monthlyValue - a.deals.monthlyValue);

    return {
      teamMembers: userStats,
      summary: {
        totalMembers: users.length,
        totalActivities: userStats.reduce(
          (sum, u) => sum + u.activities.total,
          0,
        ),
        totalDeals: userStats.reduce((sum, u) => sum + u.deals.total, 0),
        totalRevenue: userStats.reduce((sum, u) => sum + u.deals.totalValue, 0),
      },
    };
  }

  /**
   * Get comprehensive dashboard overview
   * Returns all key metrics in one call
   */
  async getDashboardOverview(companyId: string) {
    const [pipeline, revenue, activities, team] = await Promise.all([
      this.getPipelineStats(companyId),
      this.getRevenueForecast(companyId),
      this.getActivityStats(companyId),
      this.getTeamPerformance(companyId),
    ]);

    return {
      pipeline,
      revenue,
      activities,
      team,
      generatedAt: new Date().toISOString(),
    };
  }
}
