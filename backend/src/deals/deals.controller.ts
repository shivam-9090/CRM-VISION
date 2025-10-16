import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
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
  async findAll(@Request() req: any) {
    return this.dealsService.findAll(req.user.companyId);
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