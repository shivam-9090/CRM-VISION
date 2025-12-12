import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
} from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import {
  AssignTaskDto,
  StartTaskDto,
  CompleteTaskDto,
  UpdateTaskStatusDto,
} from './dto/task-actions.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks with filters' })
  @ApiResponse({ status: 200, description: 'Returns filtered tasks' })
  findAll(@Query() filterDto: FilterTaskDto) {
    return this.tasksService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiResponse({ status: 200, description: 'Returns task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update task' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req,
  ) {
    return this.tasksService.update(id, updateTaskDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id') id: string, @Request() req) {
    return this.tasksService.remove(id, req.user.id);
  }

  @Post(':id/assign')
  @ApiOperation({ summary: 'Assign task to employee' })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  assign(
    @Param('id') id: string,
    @Body() assignDto: AssignTaskDto,
    @Request() req,
  ) {
    return this.tasksService.assignTask(id, assignDto, req.user.id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start working on task' })
  @ApiResponse({ status: 200, description: 'Task started successfully' })
  @ApiResponse({ status: 403, description: 'Not assigned to you' })
  start(
    @Param('id') id: string,
    @Body() startDto: StartTaskDto,
    @Request() req,
  ) {
    return this.tasksService.startTask(id, startDto, req.user.id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark task as completed' })
  @ApiResponse({ status: 200, description: 'Task completed successfully' })
  @ApiResponse({ status: 403, description: 'Not assigned to you' })
  complete(
    @Param('id') id: string,
    @Body() completeDto: CompleteTaskDto,
    @Request() req,
  ) {
    return this.tasksService.completeTask(id, completeDto, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateTaskStatusDto,
    @Request() req,
  ) {
    return this.tasksService.updateStatus(id, statusDto, req.user.id);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get task history' })
  @ApiResponse({ status: 200, description: 'Returns task history' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  getHistory(@Param('id') id: string) {
    return this.tasksService.getTaskHistory(id);
  }
}
