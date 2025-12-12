import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EmployeePerformanceService } from './employee-performance.service';
import {
  CreatePerformanceReviewDto,
  UpdateSkillsDto,
  UpdateWorkCapacityDto,
} from './dto/performance.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Employee Performance')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('employees')
export class EmployeePerformanceController {
  constructor(
    private readonly performanceService: EmployeePerformanceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all employees with performance metrics' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Returns list of employees with scores',
  })
  getAllEmployees(@Query('companyId') companyId?: string) {
    return this.performanceService.getAllEmployees(companyId);
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get top performing employees' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns leaderboard of top performers',
  })
  getLeaderboard(
    @Query('companyId') companyId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.performanceService.getLeaderboard(
      companyId,
      limit ? parseInt(limit) : 10,
    );
  }

  @Get(':id/performance')
  @ApiOperation({ summary: 'Get detailed performance metrics for employee' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed performance breakdown',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  getPerformance(@Param('id') id: string) {
    return this.performanceService.getEmployeePerformance(id);
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: 'Get employee task history' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns task history with analytics',
  })
  getTaskHistory(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.performanceService.getEmployeeTaskHistory(
      id,
      limit ? parseInt(limit) : 50,
    );
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Create performance review for employee' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  createReview(
    @Param('id') id: string,
    @Body() reviewDto: CreatePerformanceReviewDto,
    @Request() req,
  ) {
    // Override userId from URL param
    reviewDto.userId = id;
    return this.performanceService.createPerformanceReview(
      reviewDto,
      req.user.id,
    );
  }

  @Put(':id/skills')
  @ApiOperation({ summary: 'Update employee skills' })
  @ApiResponse({ status: 200, description: 'Skills updated successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  updateSkills(@Param('id') id: string, @Body() skillsDto: UpdateSkillsDto) {
    return this.performanceService.updateEmployeeSkills(id, skillsDto);
  }

  @Put(':id/capacity')
  @ApiOperation({ summary: 'Update employee work capacity' })
  @ApiResponse({
    status: 200,
    description: 'Work capacity updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  updateCapacity(
    @Param('id') id: string,
    @Body() capacityDto: UpdateWorkCapacityDto,
  ) {
    return this.performanceService.updateWorkCapacity(id, capacityDto);
  }

  @Post(':id/recalculate-score')
  @ApiOperation({ summary: 'Manually recalculate performance score' })
  @ApiResponse({ status: 200, description: 'Score recalculated successfully' })
  recalculateScore(@Param('id') id: string) {
    return this.performanceService.recalculateScore(id);
  }
}
