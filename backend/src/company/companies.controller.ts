import {
  Controller,
  Get,
  Put,
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
  })
  @ApiResponse({
    status: 200,
    description: 'Returns user company data with related entities',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async findAll(@Request() req: RequestWithUser) {
    // Return only the user's company
    return this.companiesService.findUserCompany(req.user.companyId);
  }

  @Get('profile')
  @Permissions(PERMISSIONS.COMPANY_READ)
  async getProfile(@Request() req: RequestWithUser) {
    // Get user's company profile
    return this.companiesService.findOne(req.user.companyId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.COMPANY_READ)
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Only allow access to user's own company
    if (id !== req.user.companyId) {
      throw new Error('Access denied');
    }
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  @Permissions(PERMISSIONS.COMPANY_UPDATE)
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
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    // Only allow deleting user's own company
    if (id !== req.user.companyId) {
      throw new Error('Access denied');
    }
    return this.companiesService.remove(id);
  }
}