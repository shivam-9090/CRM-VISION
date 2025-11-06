import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { AttachmentsService } from './attachments.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/constants/permissions.constants';
import type { RequestWithUser } from '../common/types/request.types';
import * as fs from 'fs';

// File upload configuration
const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const randomName = Array(32)
      .fill(null)
      .map(() => Math.round(Math.random() * 16).toString(16))
      .join('');
    cb(null, `${randomName}${extname(file.originalname)}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Allow common file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('File type not allowed'), false);
  }
};

@Controller('attachments')
@UseGuards(AuthGuard, PermissionsGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @Permissions(
    PERMISSIONS.DEAL_CREATE,
    PERMISSIONS.CONTACT_CREATE,
    PERMISSIONS.ACTIVITY_CREATE,
  )
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() createAttachmentDto: CreateAttachmentDto,
    @Request() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.attachmentsService.create(
      file,
      createAttachmentDto,
      req.user.companyId,
      req.user.id,
    );
  }

  @Get()
  @Permissions(
    PERMISSIONS.DEAL_READ,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.ACTIVITY_READ,
  )
  async findByEntity(
    @Query('type') type: string,
    @Query('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    if (!type || !id) {
      throw new BadRequestException(
        'type and id query parameters are required',
      );
    }

    return this.attachmentsService.findByEntity(type, id, req.user.companyId);
  }

  @Get(':id/download')
  @Permissions(
    PERMISSIONS.DEAL_READ,
    PERMISSIONS.CONTACT_READ,
    PERMISSIONS.ACTIVITY_READ,
  )
  async downloadFile(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Res() res: Response,
  ) {
    const attachment = await this.attachmentsService.findOne(
      id,
      req.user.companyId,
    );

    if (!fs.existsSync(attachment.path)) {
      throw new BadRequestException('File not found on disk');
    }

    res.setHeader('Content-Type', attachment.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${attachment.originalName}"`,
    );

    const fileStream = fs.createReadStream(attachment.path);
    fileStream.pipe(res);
  }

  @Delete(':id')
  @Permissions(
    PERMISSIONS.DEAL_DELETE,
    PERMISSIONS.CONTACT_DELETE,
    PERMISSIONS.ACTIVITY_DELETE,
  )
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.attachmentsService.remove(id, req.user.companyId, req.user.id);
  }
}
