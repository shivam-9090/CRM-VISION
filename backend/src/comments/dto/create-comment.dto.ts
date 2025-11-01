import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CommentableType } from '@prisma/client';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(CommentableType)
  @IsNotEmpty()
  commentableType: CommentableType;

  @IsString()
  @IsNotEmpty()
  commentableId: string;
}
