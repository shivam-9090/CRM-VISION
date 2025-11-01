import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    file: Express.Multer.File,
    createAttachmentDto: CreateAttachmentDto,
    companyId: string,
    userId: string,
  ) {
    const attachment = await this.prisma.attachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        url: `/uploads/${file.filename}`,
        attachableType: createAttachmentDto.attachableType,
        attachableId: createAttachmentDto.attachableId,
        companyId,
        uploadedBy: userId,
      },
    });

    return attachment;
  }

  async findByEntity(
    attachableType: string,
    attachableId: string,
    companyId: string,
  ) {
    const attachments = await this.prisma.attachment.findMany({
      where: {
        attachableType: attachableType as any,
        attachableId,
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return attachments;
  }

  async findOne(id: string, companyId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    return attachment;
  }

  async remove(id: string, companyId: string, userId: string) {
    const attachment = await this.findOne(id, companyId);

    // Only allow the uploader or admin to delete
    if (attachment.uploadedBy !== userId) {
      throw new ForbiddenException(
        'You can only delete your own attachments',
      );
    }

    // Delete file from filesystem
    try {
      if (fs.existsSync(attachment.path)) {
        fs.unlinkSync(attachment.path);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }

    // Delete from database
    await this.prisma.attachment.delete({
      where: { id },
    });

    return { message: 'Attachment deleted successfully' };
  }

  async getFilePath(id: string, companyId: string): Promise<string> {
    const attachment = await this.findOne(id, companyId);
    return attachment.path;
  }
}
