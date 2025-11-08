import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  UseGuards,
  Req,
  Res,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import type { Response } from 'express';
import { ExportService } from './export.service';
import { ExportJobService } from './export-job.service';
import { ExportTemplateService } from './export-template.service';
import { FileStorageService } from './file-storage.service';
import { ImportService } from './import.service';
import { CreateScheduledExportDto } from './dto/scheduled-export.dto';
import { ExportQueryDto } from './dto/export-query.dto';
import type { RequestWithUser } from '../common/types/request.types';

@Controller('export')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly exportJobService: ExportJobService,
    private readonly exportTemplateService: ExportTemplateService,
    private readonly fileStorageService: FileStorageService,
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
  async exportDeals(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const csv = await this.exportService.exportDeals(
      req.user.companyId,
      startDate,
      endDate,
    );

    // Generate filename based on date range
    const dateRange =
      startDate && endDate
        ? `${startDate}_to_${endDate}`
        : new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=deals_export_${dateRange}.csv`,
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

  // ========== Export Templates ==========

  /**
   * Create export template
   */
  @Post('templates')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async createTemplate(
    @Req() req: RequestWithUser,
    @Body()
    body: {
      name: string;
      description?: string;
      entityType: string;
      fields: string[];
      filters?: Record<string, any>;
      format?: string;
    },
  ) {
    return this.exportTemplateService.createTemplate(
      req.user.id,
      req.user.companyId,
      body,
    );
  }

  /**
   * List export templates
   */
  @Get('templates')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async listTemplates(
    @Req() req: RequestWithUser,
    @Query('entityType') entityType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exportTemplateService.listTemplates(
      req.user.id,
      req.user.companyId,
      {
        entityType,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      },
    );
  }

  /**
   * Get export template by ID
   */
  @Get('templates/:id')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async getTemplate(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.exportTemplateService.getTemplate(
      id,
      req.user.id,
      req.user.companyId,
    );
  }

  /**
   * Update export template
   */
  @Put('templates/:id')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async updateTemplate(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      fields?: string[];
      filters?: Record<string, any>;
      format?: string;
    },
  ) {
    return this.exportTemplateService.updateTemplate(
      id,
      req.user.id,
      req.user.companyId,
      body,
    );
  }

  /**
   * Delete export template
   */
  @Delete('templates/:id')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async deleteTemplate(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.exportTemplateService.deleteTemplate(
      id,
      req.user.id,
      req.user.companyId,
    );
  }

  /**
   * Get template usage statistics
   */
  @Get('templates/:id/stats')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async getTemplateStats(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.exportTemplateService.getTemplateUsageStats(
      id,
      req.user.id,
      req.user.companyId,
    );
  }

  // ========== Export Jobs ==========

  /**
   * Create scheduled export job
   */
  @Post('jobs')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async createJob(
    @Req() req: RequestWithUser,
    @Body() body: CreateScheduledExportDto,
  ) {
    return this.exportJobService.createJob(
      req.user.id,
      req.user.companyId,
      body,
    );
  }

  /**
   * List export jobs
   */
  @Get('jobs')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async listJobs(
    @Req() req: RequestWithUser,
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
    @Query('schedule') schedule?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.exportJobService.listJobs(req.user.id, req.user.companyId, {
      status,
      entityType,
      schedule,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * Get export job by ID
   */
  @Get('jobs/:id')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async getJob(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.exportJobService.getJob(id, req.user.id, req.user.companyId);
  }

  /**
   * Download export job file
   */
  @Get('jobs/:id/download')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async downloadJobFile(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const job = await this.exportJobService.getJob(
      id,
      req.user.id,
      req.user.companyId,
    );

    if (job.status !== 'COMPLETED') {
      throw new BadRequestException('Export job is not completed yet');
    }

    if (!job.fileUrl) {
      throw new NotFoundException('Export file not found');
    }

    // TODO: Implement file download from storage
    // For now, return job details
    return res.json({
      message: 'File download endpoint - implementation pending',
      job: {
        id: job.id,
        fileName: job.fileName,
        fileSize: job.fileSize,
        fileUrl: job.fileUrl,
      },
    });
  }

  /**
   * Cancel export job
   */
  @Post('jobs/:id/cancel')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async cancelJob(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.exportJobService.cancelJob(
      id,
      req.user.id,
      req.user.companyId,
    );
  }

  /**
   * Delete export job
   */
  @Delete('jobs/:id')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async deleteJob(@Req() req: RequestWithUser, @Param('id') id: string) {
    return this.exportJobService.deleteJob(
      id,
      req.user.id,
      req.user.companyId,
    );
  }

  /**
   * Get export job statistics
   */
  @Get('stats/jobs')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async getJobStats(
    @Req() req: RequestWithUser,
    @Query('days') days?: string,
  ) {
    return this.exportJobService.getJobStats(
      req.user.companyId,
      days ? parseInt(days, 10) : 30,
    );
  }

  /**
   * Clean up expired export jobs
   */
  @Post('cleanup')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async cleanupExpiredJobs() {
    return this.exportJobService.deleteExpiredJobs();
  }

  /**
   * Download export file by filename
   * Validates user access to the file through job ownership
   */
  @Get('download/:fileName')
  @Permissions(PERMISSIONS.DATA_EXPORT)
  async downloadFile(
    @Param('fileName') fileName: string,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    try {
      // Get file info to validate existence
      const fileInfo = await this.fileStorageService.getFileInfo(fileName);

      if (!fileInfo.exists) {
        throw new NotFoundException('Export file not found or has expired');
      }

      // Validate user has access to this file by checking job ownership
      const jobs = await this.exportJobService.listJobs(
        req.user.id,
        req.user.companyId,
        { page: 1, limit: 100 }, // Check recent 100 jobs
      );

      const job = jobs.data.find((j: any) => j.fileName === fileName);

      if (!job) {
        throw new NotFoundException(
          'You do not have permission to access this file',
        );
      }

      // Check if file has expired (24 hours default)
      const fileAge = Date.now() - fileInfo.created.getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      if (fileAge > maxAge) {
        // Delete expired file
        await this.fileStorageService.deleteFile(fileName);
        throw new NotFoundException('Export file has expired and been deleted');
      }

      // Set content type based on file extension
      const ext = fileName.split('.').pop()?.toLowerCase();
      const contentTypes: Record<string, string> = {
        csv: 'text/csv',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        json: 'application/json',
        xml: 'application/xml',
        zip: 'application/zip',
      };

      const contentType =
        (ext && contentTypes[ext]) || 'application/octet-stream';

      // Read file content
      const fileContent = await this.fileStorageService.readFile(fileName);

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );
      res.setHeader('Content-Length', fileInfo.size);

      // Send file
      res.send(fileContent);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
