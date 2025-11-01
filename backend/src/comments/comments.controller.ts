import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import { CommentableType } from '@prisma/client';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('api/comments')
@UseGuards(AuthGuard, PermissionsGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @Permissions(PERMISSIONS.COMMENT_CREATE)
  create(
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.commentsService.create(
      createCommentDto,
      req.user.id,
      req.user.companyId,
    );
  }

  @Get()
  @Permissions(PERMISSIONS.COMMENT_READ)
  findAll(
    @Request() req: RequestWithUser,
    @Query('type') type?: CommentableType,
    @Query('id') id?: string,
  ) {
    return this.commentsService.findAll(req.user.companyId, type, id);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.COMMENT_READ)
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.commentsService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.COMMENT_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: RequestWithUser,
  ) {
    return this.commentsService.update(
      id,
      updateCommentDto,
      req.user.id,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.COMMENT_DELETE)
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.commentsService.remove(
      id,
      req.user.id,
      req.user.companyId,
      req.user.role,
    );
  }
}