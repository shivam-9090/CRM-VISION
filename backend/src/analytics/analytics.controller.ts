import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import { AnalyticsService } from './analytics.service';

interface RequestWithUser {
  user: {
    userId: string;
    email: string;
    companyId: string;
  };
}

@Controller('analytics')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('pipeline')
  @Permissions(PERMISSIONS.ANALYTICS_READ)
  async getPipelineStats(@Request() req: RequestWithUser) {
    return this.analyticsService.getPipelineStats(req.user.companyId);
  }

  @Get('revenue')
  @Permissions(PERMISSIONS.ANALYTICS_READ)
  async getRevenueForecast(@Request() req: RequestWithUser) {
    return this.analyticsService.getRevenueForecast(req.user.companyId);
  }

  @Get('activities')
  @Permissions(PERMISSIONS.ANALYTICS_READ)
  async getActivityStats(@Request() req: RequestWithUser) {
    return this.analyticsService.getActivityStats(req.user.companyId);
  }

  @Get('team')
  @Permissions(PERMISSIONS.ANALYTICS_READ)
  async getTeamPerformance(@Request() req: RequestWithUser) {
    return this.analyticsService.getTeamPerformance(req.user.companyId);
  }

  @Get('overview')
  @Permissions(PERMISSIONS.ANALYTICS_READ)
  async getDashboardOverview(@Request() req: RequestWithUser) {
    return this.analyticsService.getDashboardOverview(req.user.companyId);
  }
}