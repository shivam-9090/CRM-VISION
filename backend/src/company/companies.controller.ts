import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import type { RequestWithUser } from '../common/types/request.types';
import {
  ApiGetById,
  ApiUpdate,
  ApiDelete,
} from '../common/swagger/swagger-decorators';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(AuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  @Permissions(PERMISSIONS.COMPANY_READ)
  @ApiOperation({
    summary: 'Get user company profile',
    description:
      'Returns the company profile for the authenticated user with related entities',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user company data with related entities',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async findAll(@Request() req: RequestWithUser) {
    // Return only the user's company
    return this.companiesService.findUserCompany(req.user.companyId);
  }

  @Get('profile')
  @Permissions(PERMISSIONS.COMPANY_READ)
  @ApiOperation({
    summary: 'Get company profile details',
    description: 'Get detailed company profile for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Company profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getProfile(@Request() req: RequestWithUser) {
    // Get user's company profile
    return this.companiesService.findOne(req.user.companyId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.COMPANY_READ)
  @ApiGetById(
    'Get company by ID',
    'Get company details. Only accessible for user own company.',
  )
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Only allow access to user's own company
    if (id !== req.user.companyId) {
      throw new Error('Access denied');
    }
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  @Patch(':id')
  @Permissions(PERMISSIONS.COMPANY_UPDATE)
  @ApiUpdate(
    'Update company',
    'Update company details. Only accessible for user own company.',
  )
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req: RequestWithUser,
  ) {
    // Only allow updating user's own company
    if (id !== req.user.companyId) {
      throw new Error('Access denied');
    }
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.COMPANY_DELETE)
  @ApiDelete(
    'Delete company',
    'Delete company and all related data. Admin only. Irreversible operation.',
  )
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Only allow deleting user's own company
    if (id !== req.user.companyId) {
      throw new Error('Access denied');
    }
    return this.companiesService.remove(id);
  }
}
