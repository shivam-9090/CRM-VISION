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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto, InviteUserDto } from './dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import type { RequestWithUser } from '../common/types/request.types';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import { Role } from '@prisma/client';
import {
  ApiList,
  ApiGetById,
  ApiUpdate,
  ApiDelete,
  ApiCreate,
} from '../common/swagger/swagger-decorators';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @Permissions(PERMISSIONS.USER_READ)
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the authenticated user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  getProfile(@Request() req: RequestWithUser) {
    return this.userService.getProfile(req.user.id);
  }

  @Get()
  @Permissions(PERMISSIONS.USER_READ)
  @ApiList(
    'Get all users in company',
    'Retrieve all team members in the current user company',
  )
  findAll(@Request() req: RequestWithUser) {
    return this.userService.findAllByCompany(req.user.companyId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.USER_READ)
  @ApiGetById('Get user by ID', 'Retrieve a specific user by their ID')
  findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.userService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  @Permissions(PERMISSIONS.USER_UPDATE)
  @ApiUpdate(
    'Update user profile',
    'Update user profile. Users can update their own profile, admins can update any user',
  )
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

  @Delete(':id')
  @Permissions(PERMISSIONS.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDelete(
    'Delete user',
    'Delete a user from the company. Admin only. Cannot delete yourself.',
  )
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.userService.remove(id, req.user.companyId, req.user.id);
  }

  @Post('invite')
  @Permissions(PERMISSIONS.USER_INVITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreate(
    'Invite user to company',
    'Send an invitation email to a new user. Admin only. Creates a pending invite.',
  )
  inviteUser(
    @Body() inviteUserDto: InviteUserDto,
    @Request() req: RequestWithUser,
  ) {
    return this.userService.inviteUser(inviteUserDto, req.user.companyId);
  }

  // ==================== EMPLOYEE MANAGEMENT ENDPOINTS ====================
  // Only accessible by MANAGER and ADMIN roles

  @Post('employees')
  @Permissions(PERMISSIONS.USER_CREATE, PERMISSIONS.USER_INVITE)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreate(
    'Add employee to company',
    'Manager/Admin can add a new employee to their company. Creates employee with EMPLOYEE role.',
  )
  addEmployee(
    @Body() addEmployeeDto: InviteUserDto,
    @Request() req: RequestWithUser,
  ) {
    // Only MANAGER and ADMIN can add employees
    if (req.user.role !== Role.MANAGER && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only managers and admins can add employees',
      );
    }
    return this.userService.addEmployee(addEmployeeDto, req.user.companyId);
  }

  @Get('employees/list')
  @Permissions(PERMISSIONS.USER_READ)
  @ApiOperation({
    summary: 'Get all employees in company',
    description:
      'Manager/Admin can view all employees in their company (excludes managers and admins)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of employees retrieved successfully',
  })
  getEmployees(@Request() req: RequestWithUser) {
    // Only MANAGER and ADMIN can view employee list
    if (req.user.role !== Role.MANAGER && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only managers and admins can view employee list',
      );
    }
    return this.userService.getEmployees(req.user.companyId);
  }

  @Patch('employees/:id')
  @Permissions(PERMISSIONS.USER_UPDATE)
  @ApiUpdate('Update employee', 'Manager/Admin can update employee information')
  updateEmployee(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: RequestWithUser,
  ) {
    // Only MANAGER and ADMIN can update employees
    if (req.user.role !== Role.MANAGER && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only managers and admins can update employees',
      );
    }
    return this.userService.updateEmployee(
      id,
      updateUserDto,
      req.user.companyId,
    );
  }

  @Delete('employees/:id')
  @Permissions(PERMISSIONS.USER_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDelete(
    'Remove employee',
    'Manager/Admin can remove an employee from the company',
  )
  removeEmployee(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Only MANAGER and ADMIN can remove employees
    if (req.user.role !== Role.MANAGER && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only managers and admins can remove employees',
      );
    }
    return this.userService.removeEmployee(id, req.user.companyId, req.user.id);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change user password',
    description: 'Allow users to change their own password',
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid current password or validation error',
  })
  changePassword(
    @Body() changePasswordDto: { currentPassword: string; newPassword: string },
    @Request() req: RequestWithUser,
  ) {
    return this.userService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }
}
