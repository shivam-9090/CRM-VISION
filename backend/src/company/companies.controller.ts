import { Controller, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('companies')
@UseGuards(AuthGuard)
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  async findAll(@Request() req: any) {
    // Return only the user's company
    return this.companiesService.findUserCompany(req.user.companyId);
  }

  @Get('profile')
  async getProfile(@Request() req: any) {
    // Get user's company profile
    return this.companiesService.findOne(req.user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    // Only allow access to user's own company
    if (id !== req.user.companyId) {
      throw new Error('Access denied');
    }
    return this.companiesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto, @Request() req: any) {
    // Only allow updating user's own company
    if (id !== req.user.companyId) {
      throw new Error('Access denied');
    }
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    // Only allow deleting user's own company
    if (id !== req.user.companyId) {
      throw new Error('Access denied');
    }
    return this.companiesService.remove(id);
  }
}