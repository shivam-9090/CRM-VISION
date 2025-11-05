import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { ImportService } from './import.service';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('export')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly importService: ImportService,
  ) {}

  /**
   * Export contacts to CSV
   */
  @Get('contacts')
  @Permissions(PERMISSIONS.DATA_EXPORT, PERMISSIONS.CONTACT_EXPORT)
  async exportContacts(@Req() req: RequestWithUser, @Res() res: Response) {
    const csv = await this.exportService.exportContacts(req.user.companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=contacts-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csv);
  }

  /**
   * Export deals to CSV
   */
  @Get('deals')
  @Permissions(PERMISSIONS.DATA_EXPORT, PERMISSIONS.DEAL_EXPORT)
  async exportDeals(@Req() req: RequestWithUser, @Res() res: Response) {
    const csv = await this.exportService.exportDeals(req.user.companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=deals-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csv);
  }

  /**
   * Export activities to CSV
   */
  @Get('activities')
  @Permissions(PERMISSIONS.DATA_EXPORT, PERMISSIONS.ACTIVITY_EXPORT)
  async exportActivities(@Req() req: RequestWithUser, @Res() res: Response) {
    const csv = await this.exportService.exportActivities(req.user.companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=activities-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csv);
  }

  /**
   * Export company to CSV
   */
  @Get('company')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async exportCompany(@Req() req: RequestWithUser, @Res() res: Response) {
    const csv = await this.exportService.exportCompanies(req.user.companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=company-${new Date().toISOString().split('T')[0]}.csv`,
    );
    res.send(csv);
  }

  /**
   * Import contacts from CSV
   */
  @Post('import/contacts')
  @Permissions(PERMISSIONS.DATA_IMPORT, PERMISSIONS.CONTACT_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  async importContacts(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const csvContent = file.buffer.toString('utf-8');
    const result = await this.importService.importContacts(
      csvContent,
      req.user.companyId,
    );

    return {
      message: 'Import completed',
      ...result,
    };
  }

  /**
   * Import deals from CSV
   */
  @Post('import/deals')
  @Permissions(PERMISSIONS.DATA_IMPORT, PERMISSIONS.DEAL_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  async importDeals(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const csvContent = file.buffer.toString('utf-8');
    const result = await this.importService.importDeals(
      csvContent,
      req.user.companyId,
    );

    return {
      message: 'Import completed',
      ...result,
    };
  }

  /**
   * Import activities from CSV
   */
  @Post('import/activities')
  @Permissions(PERMISSIONS.DATA_IMPORT, PERMISSIONS.ACTIVITY_CREATE)
  @UseInterceptors(FileInterceptor('file'))
  async importActivities(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const csvContent = file.buffer.toString('utf-8');
    const result = await this.importService.importActivities(
      csvContent,
      req.user.companyId,
    );

    return {
      message: 'Import completed',
      ...result,
    };
  }
}