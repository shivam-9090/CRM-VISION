import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EmailService } from './email.service';
import { TemplateService } from './template.service';
import { SendEmailDto, SendBulkEmailDto } from './dto/send-email.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { SWAGGER_RESPONSES } from '../common/swagger/swagger-responses';

@ApiTags('Email')
@Controller('email')
@UseGuards(AuthGuard, PermissionsGuard)
@ApiBearerAuth('JWT-auth')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly templateService: TemplateService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions('email:send')
  @ApiOperation({
    summary: 'Queue an email for sending',
    description:
      'Queue a single email using a template. Returns a job ID for status tracking. Emails are sent asynchronously with automatic retries.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Email queued successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Email queued successfully' },
        jobId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse(SWAGGER_RESPONSES.BAD_REQUEST_400)
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.FORBIDDEN_403)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async queueEmail(@Body() sendEmailDto: SendEmailDto) {
    const jobId = await this.emailService.queueEmail(sendEmailDto);

    return {
      success: true,
      message: 'Email queued successfully',
      jobId,
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.ACCEPTED)
  @Permissions('email:send:bulk')
  @ApiOperation({
    summary: 'Queue bulk emails for sending',
    description:
      'Queue multiple emails to different recipients using the same template. Efficient for sending notifications or announcements.',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Bulk emails queued successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Bulk emails queued successfully',
        },
        jobId: {
          type: 'string',
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    },
  })
  @ApiResponse(SWAGGER_RESPONSES.BAD_REQUEST_400)
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.FORBIDDEN_403)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async queueBulkEmail(@Body() sendBulkEmailDto: SendBulkEmailDto) {
    const jobId = await this.emailService.queueBulkEmail(sendBulkEmailDto);

    return {
      success: true,
      message: 'Bulk emails queued successfully',
      jobId,
    };
  }

  @Get('status/:jobId')
  @Permissions('email:view')
  @ApiOperation({
    summary: 'Get email delivery status',
    description:
      'Track the delivery status of a queued email using the job ID. Returns detailed information including status, timestamps, and error messages.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Email job ID returned from queue endpoint',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email delivery status retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            jobId: { type: 'string' },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'BOUNCED'],
            },
            to: { type: 'string', example: 'user@example.com' },
            subject: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            sentAt: { type: 'string', format: 'date-time', nullable: true },
            attempts: { type: 'number' },
            error: { type: 'string', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse(SWAGGER_RESPONSES.NOT_FOUND_404)
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.FORBIDDEN_403)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async getEmailStatus(@Param('jobId') jobId: string) {
    const status = await this.emailService.getDeliveryStatus(jobId);

    if (!status) {
      return {
        success: false,
        message: 'Email job not found',
      };
    }

    return {
      success: true,
      data: status,
    };
  }

  @Get('queue/stats')
  @Permissions('email:manage')
  @ApiOperation({
    summary: 'Get email queue statistics',
    description:
      'Retrieve real-time statistics about the email queue including pending, active, completed, failed, and delayed jobs.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Queue statistics retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            waiting: { type: 'number', example: 5 },
            active: { type: 'number', example: 2 },
            completed: { type: 'number', example: 150 },
            failed: { type: 'number', example: 3 },
            delayed: { type: 'number', example: 0 },
          },
        },
      },
    },
  })
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.FORBIDDEN_403)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async getQueueStats() {
    const stats = await this.emailService.getQueueStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Get('queue/failed')
  @Permissions('email:manage')
  @ApiOperation({ summary: 'Get failed email jobs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Failed jobs retrieved',
  })
  async getFailedJobs() {
    const failed = await this.emailService.getFailedJobs();

    return {
      success: true,
      count: failed.length,
      data: failed,
    };
  }

  @Patch('retry/:jobId')
  @Permissions('email:manage')
  @ApiOperation({
    summary: 'Retry a failed email job',
    description:
      'Manually retry a failed email job. Useful for recovering from temporary SMTP failures.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Failed email job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email job retried successfully',
  })
  @ApiResponse(SWAGGER_RESPONSES.NOT_FOUND_404)
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.FORBIDDEN_403)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async retryEmail(@Param('jobId') jobId: string) {
    const success = await this.emailService.retryEmail(jobId);

    return {
      success,
      message: success
        ? 'Email job retried successfully'
        : 'Failed to retry email job',
    };
  }

  @Patch('queue/pause')
  @Permissions('email:manage')
  @ApiOperation({ summary: 'Pause the email queue' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email queue paused',
  })
  async pauseQueue() {
    await this.emailService.pauseQueue();

    return {
      success: true,
      message: 'Email queue paused',
    };
  }

  @Patch('queue/resume')
  @Permissions('email:manage')
  @ApiOperation({ summary: 'Resume the email queue' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email queue resumed',
  })
  async resumeQueue() {
    await this.emailService.resumeQueue();

    return {
      success: true,
      message: 'Email queue resumed',
    };
  }

  @Delete('queue/cleanup')
  @Permissions('email:manage')
  @ApiOperation({ summary: 'Clean up old completed/failed jobs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Old jobs cleaned up',
  })
  async cleanupOldJobs() {
    const result = await this.emailService.cleanupOldJobs(7);

    return {
      success: true,
      message: `Cleaned up ${result.removed} old jobs`,
      removed: result.removed,
    };
  }

  @Get('templates')
  @Permissions('email:view')
  @ApiOperation({
    summary: 'Get list of available email templates',
    description:
      'List all available Handlebars email templates. Each template supports both HTML and plain text formats.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available templates retrieved',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        count: { type: 'number', example: 3 },
        data: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['PASSWORD_RESET', 'WELCOME', 'INVITATION'],
          },
        },
      },
    },
  })
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.FORBIDDEN_403)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async getAvailableTemplates() {
    const templates = await this.templateService.getAvailableTemplates();

    return {
      success: true,
      count: templates.length,
      data: templates,
    };
  }
}
