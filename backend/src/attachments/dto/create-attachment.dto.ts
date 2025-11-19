import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AttachableType } from '@prisma/client';

export class CreateAttachmentDto {
  @IsNotEmpty()
  @IsEnum(AttachableType)
  attachableType: AttachableType;

  @IsNotEmpty()
  @IsString()
  attachableId: string;
}
