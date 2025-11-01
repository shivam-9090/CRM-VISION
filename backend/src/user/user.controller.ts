import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Post,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto, InviteUserDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { RequestWithUser } from '../common/types/request.types';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import { Role } from '@prisma/client';

@Controller('api/users')
@UseGuards(AuthGuard, PermissionsGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get current user's profile
   */
  @Get('profile')
  @Permissions(PERMISSIONS.USER_READ)
  getProfile(@Request() req: RequestWithUser) {
    return this.userService.getProfile(req.user.id);
  }

  /**
   * Get all users in the company (team members)
   */
  @Get()
  @Permissions(PERMISSIONS.USER_READ)
  findAll(@Request() req: RequestWithUser) {
    return this.userService.findAllByCompany(req.user.companyId);
  }

  /**
   * Get a specific user by ID
   */
  @Get(':id')
  @Permissions(PERMISSIONS.USER_READ)
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.userService.findOne(id, req.user.companyId);
  }

  /**
   * Update user profile (self or admin)
   */
  @Patch(':id')
  @Permissions(PERMISSIONS.USER_UPDATE)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ) {
    // Allow users to update their own profile, or admins to update any
    if (id !== req.user.id && req.user.role !== Role.ADMIN) {
      throw new Error('Insufficient permissions');
    }

    return this.userService.update(id, updateUserDto, req.user.companyId);
  }

  /**
   * Delete a user (ADMIN only)
   */
  @Delete(':id')
  @Permissions(PERMISSIONS.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.userService.remove(id, req.user.companyId, req.user.id);
  }

  /**
   * Invite a new user to the company (ADMIN only)
   */
  @Post('invite')
  @Permissions(PERMISSIONS.USER_INVITE)
  @HttpCode(HttpStatus.CREATED)
  inviteUser(
    @Body() inviteUserDto: InviteUserDto,
    @Request() req: RequestWithUser,
  ) {
    return this.userService.inviteUser(inviteUserDto, req.user.companyId);
  }
}