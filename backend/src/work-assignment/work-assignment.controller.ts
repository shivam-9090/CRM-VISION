import {
  Controller,
  Get,
  Post,
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
import { WorkAssignmentService } from './work-assignment.service';
import {
  SuggestAssignmentDto,
  AcceptSuggestionDto,
  RejectSuggestionDto,
  AutoAssignTaskDto,
} from './dto/work-assignment.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Work Assignment')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('work-assignment')
export class WorkAssignmentController {
  constructor(private readonly workAssignmentService: WorkAssignmentService) {}

  @Post('suggest')
  @ApiOperation({
    summary: 'Get AI-powered employee suggestions for a task',
    description:
      'Analyzes employee performance, workload, skills, and past experience to suggest the best candidates for a task',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns list of employee suggestions with confidence scores and reasoning',
  })
  @ApiResponse({ status: 404, description: 'Task not found' })
  suggestAssignment(@Body() dto: SuggestAssignmentDto) {
    return this.workAssignmentService.suggestEmployeesForTask(
      dto.taskId,
      dto.requiredSkills,
    );
  }

  @Post('auto-assign')
  @ApiOperation({
    summary: 'Automatically assign task to best employee',
    description:
      'Uses AI to select and assign the task to the most suitable employee automatically',
  })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  @ApiResponse({ status: 400, description: 'No available employees found' })
  autoAssign(@Body() dto: AutoAssignTaskDto, @Request() req) {
    return this.workAssignmentService.autoAssignTask(
      dto.taskId,
      dto.requiredSkills,
      req.user.id,
    );
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get all pending work suggestions' })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiResponse({
    status: 200,
    description: 'Returns list of pending suggestions',
  })
  getPendingSuggestions(@Query('companyId') companyId?: string) {
    return this.workAssignmentService.getPendingSuggestions(companyId);
  }

  @Get('tasks/:taskId/suggestions')
  @ApiOperation({ summary: 'Get all suggestions for a specific task' })
  @ApiResponse({ status: 200, description: 'Returns suggestions for the task' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  getTaskSuggestions(@Param('taskId') taskId: string) {
    return this.workAssignmentService.getTaskSuggestions(taskId);
  }

  @Post('accept')
  @ApiOperation({
    summary: 'Accept a work suggestion and assign the task',
    description:
      'Accepts the AI suggestion and assigns the task to the suggested employee',
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestion accepted and task assigned',
  })
  @ApiResponse({ status: 404, description: 'Suggestion not found' })
  @ApiResponse({ status: 400, description: 'Suggestion already processed' })
  acceptSuggestion(@Body() dto: AcceptSuggestionDto, @Request() req) {
    return this.workAssignmentService.acceptSuggestion(
      dto.suggestionId,
      req.user.id,
    );
  }

  @Post('reject')
  @ApiOperation({
    summary: 'Reject a work suggestion',
    description: 'Rejects the AI suggestion without assigning the task',
  })
  @ApiResponse({ status: 200, description: 'Suggestion rejected' })
  @ApiResponse({ status: 404, description: 'Suggestion not found' })
  @ApiResponse({ status: 400, description: 'Suggestion already processed' })
  rejectSuggestion(@Body() dto: RejectSuggestionDto) {
    return this.workAssignmentService.rejectSuggestion(
      dto.suggestionId,
      dto.reason,
    );
  }
}
