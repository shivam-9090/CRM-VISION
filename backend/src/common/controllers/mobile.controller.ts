import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { MobileSyncService } from '../services/mobile-sync.service';
import {
  MobileSyncDto,
  BatchRequestDto,
  DeviceRegistrationDto,
} from '../dto/mobile-sync.dto';
import type { RequestWithUser } from '../types/request.types';

@ApiTags('mobile')
@Controller('v1/mobile')
@UseGuards(AuthGuard)
@ApiBearerAuth('JWT-auth')
export class MobileController {
  private readonly logger = new Logger(MobileController.name);

  constructor(private mobileSyncService: MobileSyncService) {}

  /**
   * Incremental sync endpoint for mobile apps
   * Fetches only changed records since last sync timestamp
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Incremental data sync for mobile',
    description:
      'Fetch changed records since last sync timestamp. Supports incremental sync with optional resource filtering.',
  })
  async syncData(
    @Request() req: RequestWithUser,
    @Body() syncDto: MobileSyncDto,
  ) {
    const startTime = Date.now();
    this.logger.log(
      `Mobile sync started for user ${req.user.id}, company ${req.user.companyId}`,
    );

    const result = await this.mobileSyncService.syncData(
      req.user.id,
      req.user.companyId,
      syncDto,
    );

    const duration = Date.now() - startTime;
    this.logger.log(
      `Mobile sync completed in ${duration}ms - ${result.meta.totalRecords} records`,
    );

    return result;
  }

  /**
   * Batch operations endpoint
   * Allows mobile apps to send multiple create/update/delete operations in one request
   */
  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch operations for mobile',
    description:
      'Process multiple create/update/delete operations in a single transaction. Reduces round trips and improves offline sync.',
  })
  async batchOperations(
    @Request() req: RequestWithUser,
    @Body() batchDto: BatchRequestDto,
  ) {
    const startTime = Date.now();
    this.logger.log(
      `Batch request started - ${batchDto.operations.length} operations`,
    );

    const result = await this.mobileSyncService.processBatch(
      req.user.id,
      req.user.companyId,
      batchDto,
    );

    const duration = Date.now() - startTime;
    this.logger.log(
      `Batch completed in ${duration}ms - ${result.stats.successful}/${result.stats.total} successful`,
    );

    return result;
  }

  /**
   * Device registration endpoint
   * Register mobile device for push notifications and tracking
   */
  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register mobile device',
    description:
      'Register device for push notifications and track mobile app versions.',
  })
  registerDevice(
    @Request() req: RequestWithUser,
    @Body() deviceDto: DeviceRegistrationDto,
  ) {
    this.logger.log(
      `Device registered: ${deviceDto.platform} ${deviceDto.deviceModel} for user ${req.user.id}`,
    );

    // TODO: Implement device registration logic
    // Store device info in database for push notifications
    // Track app versions for compatibility

    return {
      success: true,
      message: 'Device registered successfully',
      deviceId: deviceDto.deviceId,
    };
  }
}
