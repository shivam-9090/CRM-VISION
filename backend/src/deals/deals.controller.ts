import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { DealsService } from './deals.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { FilterDealDto } from './dto/filter-deal.dto';
import { BulkDeleteDto, BulkUpdateDto } from './dto/bulk-operation.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import type { RequestWithUser } from '../common/types/request.types';
import {
  ApiList,
  ApiGetById,
  ApiCreate,
  ApiUpdate,
  ApiDelete,
  ApiCustomEndpoint,
} from '../common/swagger/swagger-decorators';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(AuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class DealsController {
  constructor(private dealsService: DealsService) {}

  @Post()
  @Permissions('deal:create')
  @ApiCreate(
    'Create deal',
    'Create a new deal in the pipeline with specified stage and value',
  )
  async create(
    @Body() createDealDto: CreateDealDto,
    @Request() req: RequestWithUser,
  ) {
    return this.dealsService.create(createDealDto, req.user);
  }

  @Get()
  @Permissions('deal:read')
  @ApiList(
    'Get all deals',
    'Retrieve deals with filtering by stage, owner, date range, and search',
  )
  async findAll(
    @Query() filters: FilterDealDto,
    @Request() req: RequestWithUser,
  ) {
    return this.dealsService.findAll(req.user.companyId, filters);
  }

  @Get('stats/pipeline')
  @Permissions(PERMISSIONS.ANALYTICS_READ, PERMISSIONS.DEAL_READ)
  @ApiCustomEndpoint(
    'Get pipeline statistics',
    'Aggregate statistics for deals across all pipeline stages',
  )
  async getPipelineStats(@Request() req: RequestWithUser) {
    return this.dealsService.getPipelineStats(req.user.companyId);
  }

  @Get('stats/my-deals')
  @Permissions(PERMISSIONS.DEAL_READ)
  @ApiCustomEndpoint(
    'Get my deals statistics',
    'Statistics for deals owned by the authenticated user',
  )
  async getMyDealsStats(@Request() req: RequestWithUser) {
    return this.dealsService.getMyDealsStats(req.user.id, req.user.companyId);
  }

  @Get('export/csv')
  @Permissions(PERMISSIONS.DEAL_EXPORT, PERMISSIONS.DATA_EXPORT)
  @ApiCustomEndpoint(
    'Export deals to CSV',
    'Export filtered deals to CSV file with all deal details',
  )
  @ApiResponse({
    status: 200,
    description: 'CSV file download',
    headers: {
      'Content-Type': { description: 'text/csv' },
      'Content-Disposition': {
        description: 'attachment; filename=deals-export.csv',
      },
    },
  })
  async exportToCsv(
    @Query() filters: FilterDealDto,
    @Request() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const csv = await this.dealsService.exportToCsv(
      req.user.companyId,
      filters,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=deals-export.csv',
    );
    return res.status(HttpStatus.OK).send(csv);
  }

  @Post('bulk/delete')
  @Permissions(PERMISSIONS.DEAL_DELETE)
  @ApiCustomEndpoint(
    'Bulk delete deals',
    'Delete multiple deals at once by providing array of deal IDs',
  )
  @ApiBody({ type: BulkDeleteDto })
  async bulkDelete(
    @Body() bulkDeleteDto: BulkDeleteDto,
    @Request() req: RequestWithUser,
  ) {
    return this.dealsService.bulkDelete(
      bulkDeleteDto.dealIds,
      req.user.companyId,
    );
  }

  @Put('bulk/update')
  @Permissions(PERMISSIONS.DEAL_UPDATE)
  @ApiCustomEndpoint(
    'Bulk update deals',
    'Update stage, owner, or other properties for multiple deals at once',
  )
  @ApiBody({ type: BulkUpdateDto })
  async bulkUpdate(
    @Body() bulkUpdateDto: BulkUpdateDto,
    @Request() req: RequestWithUser,
  ) {
    return this.dealsService.bulkUpdate(
      bulkUpdateDto.dealIds,
      bulkUpdateDto,
      req.user.companyId,
    );
  }

  @Get(':id/details')
  @Permissions(PERMISSIONS.DEAL_READ)
  @ApiGetById(
    'Get deal with full details',
    'Retrieve deal including activities, contacts, and history',
  )
  async getDealDetails(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.dealsService.getDealDetails(id, req.user.companyId);
  }

  @Get(':id')
  @Permissions(PERMISSIONS.DEAL_READ)
  @ApiGetById('Get deal by ID', 'Retrieve basic deal information')
  async findOne(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.dealsService.findOne(id, req.user.companyId);
  }

  @Put(':id')
  @Patch(':id')
  @Permissions(PERMISSIONS.DEAL_UPDATE)
  @ApiUpdate(
    'Update deal',
    'Update deal properties including stage, value, close date, or owner',
  )
  async update(
    @Param('id') id: string,
    @Body() updateDealDto: UpdateDealDto,
    @Request() req: RequestWithUser,
  ) {
    return this.dealsService.update(id, updateDealDto, req.user.companyId);
  }

  @Delete(':id')
  @Permissions(PERMISSIONS.DEAL_DELETE)
  @ApiDelete('Delete deal', 'Permanently delete a deal and all associated data')
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.dealsService.remove(id, req.user.companyId);
  }
}
