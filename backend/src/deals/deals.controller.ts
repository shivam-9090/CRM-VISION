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
    return this.dealsService.create(createDealDto, req.user.id);
  }

  @Get()
  async findAll() {
    return this.dealsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.dealsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDealDto: UpdateDealDto) {
    return this.dealsService.update(id, updateDealDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.dealsService.remove(id);
  }
}