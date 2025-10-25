import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { FilterDealDto } from './dto/filter-deal.dto';
import { BulkDeleteDto, BulkUpdateDto } from './dto/bulk-operation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('deals')
@UseGuards(AuthGuard)
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Post()
  async create(@Body() createDealDto: CreateDealDto, @Request() req: any) {
    return this.dealsService.create(createDealDto, req.user);
  }

  @Get()
  async findAll(@Query() filters: FilterDealDto, @Request() req: any) {
    return this.dealsService.findAll(req.user.companyId, filters);
  }

  @Get('stats/pipeline')
  async getPipelineStats(@Request() req: any) {
    return this.dealsService.getPipelineStats(req.user.companyId);
  }

  @Get('stats/my-deals')
  async getMyDealsStats(@Request() req: any) {
    return this.dealsService.getMyDealsStats(req.user.id, req.user.companyId);
  }

  @Get('export/csv')
  async exportToCsv(@Query() filters: FilterDealDto, @Request() req: any, @Res() res: Response) {
    const csv = await this.dealsService.exportToCsv(req.user.companyId, filters);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=deals-export.csv');
    return res.status(HttpStatus.OK).send(csv);
  }

  @Post('bulk/delete')
  async bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto, @Request() req: any) {
    return this.dealsService.bulkDelete(bulkDeleteDto.dealIds, req.user.companyId);
  }

  @Put('bulk/update')
  async bulkUpdate(@Body() bulkUpdateDto: BulkUpdateDto, @Request() req: any) {
    return this.dealsService.bulkUpdate(
      bulkUpdateDto.dealIds,
      bulkUpdateDto,
      req.user.companyId
    );
  }

  @Get(':id/details')
  async getDealDetails(@Param('id') id: string, @Request() req: any) {
    return this.dealsService.getDealDetails(id, req.user.companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.dealsService.findOne(id, req.user.companyId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto, @Request() req: any) {
    return this.dealsService.update(id, updateDealDto, req.user.companyId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.dealsService.remove(id, req.user.companyId);
  }
}