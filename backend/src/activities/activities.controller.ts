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
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import { PaginationDto } from '../common/dto/pagination.dto';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('activities')
@UseGuards(AuthGuard, PermissionsGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Permissions(PERMISSIONS.ACTIVITY_CREATE)
  create(
    @Body() createActivityDto: CreateActivityDto,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.create(createActivityDto, req.user.id);
  }

  @Get()
  @Permissions(PERMISSIONS.ACTIVITY_READ)
  findAll(
    @Query() pagination: PaginationDto,
    @Query('type') type?: string,
    @Request() req: RequestWithUser = {} as RequestWithUser,
  ) {
    return this.activitiesService.findAll(
      req.user.companyId,
      pagination,
      type,
    );
  }

  @Get(':id')
  @Permissions(PERMISSIONS.ACTIVITY_READ)
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.activitiesService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.ACTIVITY_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateActivityDto: UpdateActivityDto,
    @Request() req: RequestWithUser,
  ) {
    return this.activitiesService.update(
      id,
      updateActivityDto,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.ACTIVITY_DELETE)
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.activitiesService.remove(id, req.user.companyId);
  }
}