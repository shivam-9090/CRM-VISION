import {
  IsString,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailTemplate } from '../interfaces/email.interface';

export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address(es)',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Email subject',
    example: 'Welcome to CRM System',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Email template to use',
    enum: EmailTemplate,
    example: EmailTemplate.WELCOME,
  })
  @IsEnum(EmailTemplate, { message: 'Invalid email template' })
  template: EmailTemplate;

  @ApiProperty({
    description: 'Template context variables',
    example: { name: 'John Doe', loginUrl: 'https://crm.example.com/login' },
  })
  @IsObject()
  context: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Email priority (0-10, higher = more priority)',
    example: 5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;
}

export class SendBulkEmailDto {
  @ApiProperty({
    description: 'Array of recipient email addresses',
    example: ['user1@example.com', 'user2@example.com'],
  })
  @IsArray()
  @IsEmail(
    {},
    { each: true, message: 'Each recipient must be a valid email address' },
  )
  to: string[];

  @ApiProperty({
    description: 'Email subject',
    example: 'System Maintenance Notification',
  })
  @IsString()
  subject: string;

  @ApiProperty({
    description: 'Email template to use',
    enum: EmailTemplate,
    example: EmailTemplate.WELCOME,
  })
  @IsEnum(EmailTemplate, { message: 'Invalid email template' })
  template: EmailTemplate;

  @ApiProperty({
    description: 'Template context variables',
    example: { name: 'User', message: 'System will be down for maintenance' },
  })
  @IsObject()
  context: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Email priority (0-10, higher = more priority)',
    example: 5,
    minimum: 0,
    maximum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  priority?: number;
}
