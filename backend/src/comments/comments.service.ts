import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentableType } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createCommentDto: CreateCommentDto,
    userId: string,
    companyId: string,
  ) {
    // Verify that the commentable entity exists and belongs to the user's company
    await this.verifyEntityAccess(
      createCommentDto.commentableType,
      createCommentDto.commentableId,
      companyId,
    );

    return this.prisma.comment.create({
      data: {
        content: createCommentDto.content,
        commentableType: createCommentDto.commentableType,
        commentableId: createCommentDto.commentableId,
        userId,
        companyId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(
    companyId: string,
    commentableType?: CommentableType,
    commentableId?: string,
  ) {
    const where: any = { companyId };

    if (commentableType) {
      where.commentableType = commentableType;
    }

    if (commentableId) {
      where.commentableId = commentableId;
    }

    return this.prisma.comment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, companyId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id, companyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async update(
    id: string,
    updateCommentDto: UpdateCommentDto,
    userId: string,
    companyId: string,
  ) {
    const comment = await this.findOne(id, companyId);

    // Only allow the comment author to update their own comment
    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async remove(
    id: string,
    userId: string,
    companyId: string,
    userRole: string,
  ) {
    const comment = await this.findOne(id, companyId);

    // Allow deletion by comment author or admin
    if (comment.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        'You can only delete your own comments or you must be an admin',
      );
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }

  private async verifyEntityAccess(
    type: CommentableType,
    entityId: string,
    companyId: string,
  ) {
    let entity: any;

    switch (type) {
      case 'DEAL':
        entity = await this.prisma.deal.findFirst({
          where: { id: entityId, companyId },
        });
        break;
      case 'CONTACT':
        entity = await this.prisma.contact.findFirst({
          where: { id: entityId, companyId },
        });
        break;
      case 'ACTIVITY':
        entity = await this.prisma.activity.findFirst({
          where: { id: entityId, companyId },
        });
        break;
      default:
        throw new NotFoundException('Invalid commentable type');
    }

    if (!entity) {
      throw new NotFoundException(
        `${type} with ID ${entityId} not found or access denied`,
      );
    }
  }
}
