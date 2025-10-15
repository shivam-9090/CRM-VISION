import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('activities')
@UseGuards(AuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(@Body() createActivityDto: CreateActivityDto, @Request() req) {
    return this.activitiesService.create(createActivityDto, req.user.id);
  }

  @Get()
  findAll(@Query('type') type?: string, @Request() req?) {
    return this.activitiesService.findAll(req.user.companyId, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.activitiesService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @Request() req,
  ) {
    return this.activitiesService.update(id, updateActivityDto, req.user.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.activitiesService.remove(id, req.user.companyId);
  }
}