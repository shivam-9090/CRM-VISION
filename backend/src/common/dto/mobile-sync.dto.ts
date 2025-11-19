import {
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsString,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Mobile Sync Request DTO
 * Used for incremental data synchronization
 */
export class MobileSyncDto {
  @ApiPropertyOptional({
    description: 'Last sync timestamp for incremental updates',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  lastSyncAt?: string;

  @ApiPropertyOptional({
    description: 'Resource types to sync',
    example: ['contacts', 'deals', 'activities'],
    enum: [
      'contacts',
      'deals',
      'activities',
      'companies',
      'users',
      'notifications',
    ],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resources?: string[];

  @ApiPropertyOptional({
    description: 'Include deleted records for local cleanup',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({
    description: 'Maximum records per resource type',
    example: 100,
    default: 100,
    minimum: 1,
    maximum: 500,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  limit?: number = 100;
}

/**
 * Batch Operation Request DTO
 * For mobile apps to send multiple operations in one request
 */
export class BatchOperationDto {
  @ApiProperty({
    description: 'Operation type',
    example: 'create',
    enum: ['create', 'update', 'delete'],
  })
  @IsEnum(['create', 'update', 'delete'])
  operation: 'create' | 'update' | 'delete';

  @ApiProperty({
    description: 'Resource type',
    example: 'contacts',
    enum: ['contacts', 'deals', 'activities', 'companies'],
  })
  @IsEnum(['contacts', 'deals', 'activities', 'companies'])
  resource: string;

  @ApiProperty({
    description: 'Resource ID (for update/delete)',
    example: 'ckm1234567890',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'Operation data (for create/update)',
    example: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
  })
  @IsOptional()
  data?: Record<string, any>;

  @ApiProperty({
    description: 'Client-side timestamp for conflict resolution',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsDateString()
  clientTimestamp: string;

  @ApiPropertyOptional({
    description: 'Client-generated temporary ID for correlation',
    example: 'temp-123',
  })
  @IsOptional()
  @IsString()
  tempId?: string;
}

/**
 * Batch Request DTO
 */
export class BatchRequestDto {
  @ApiProperty({
    description: 'Array of batch operations',
    type: [BatchOperationDto],
  })
  @IsArray()
  @Type(() => BatchOperationDto)
  operations: BatchOperationDto[];

  @ApiPropertyOptional({
    description: 'Device ID for tracking',
    example: 'device-abc123',
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}

/**
 * Sync Response DTO
 */
export interface SyncResponseDto {
  success: boolean;
  timestamp: string;
  data: {
    contacts?: any[];
    deals?: any[];
    activities?: any[];
    companies?: any[];
    users?: any[];
    notifications?: any[];
    deleted?: {
      contacts?: string[];
      deals?: string[];
      activities?: string[];
      companies?: string[];
    };
  };
  meta: {
    totalRecords: number;
    hasMore: boolean;
    nextSyncToken?: string;
  };
}

/**
 * Batch Response DTO
 */
export interface BatchResponseDto {
  success: boolean;
  timestamp: string;
  results: Array<{
    tempId?: string;
    operation: string;
    resource: string;
    success: boolean;
    id?: string;
    error?: {
      code: string;
      message: string;
    };
    conflict?: {
      serverVersion: any;
      clientVersion: any;
      resolution: 'server-wins' | 'client-wins' | 'manual';
    };
  }>;
  stats: {
    total: number;
    successful: number;
    failed: number;
    conflicts: number;
  };
}

/**
 * Device Registration DTO
 */
export class DeviceRegistrationDto {
  @ApiProperty({
    description: 'Device unique identifier',
    example: 'device-abc123',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    description: 'Device platform',
    example: 'ios',
    enum: ['ios', 'android', 'web'],
  })
  @IsEnum(['ios', 'android', 'web'])
  platform: string;

  @ApiProperty({
    description: 'Device model',
    example: 'iPhone 13',
  })
  @IsString()
  deviceModel: string;

  @ApiProperty({
    description: 'OS version',
    example: '15.4',
  })
  @IsString()
  osVersion: string;

  @ApiProperty({
    description: 'App version',
    example: '1.0.0',
  })
  @IsString()
  appVersion: string;

  @ApiPropertyOptional({
    description: 'Push notification token',
    example: 'expo-token-abc123',
  })
  @IsOptional()
  @IsString()
  pushToken?: string;
}
