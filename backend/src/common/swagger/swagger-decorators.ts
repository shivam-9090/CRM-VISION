import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CRUD_RESPONSES } from './swagger-responses';

/**
 * Decorator for standard list/find all endpoints
 */
export function ApiList(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ...CRUD_RESPONSES.LIST.map((r) => ApiResponse(r)),
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number (starts from 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Items per page (max 100)',
      example: 10,
    }),
    ApiQuery({
      name: 'search',
      required: false,
      type: String,
      description: 'Search query',
    }),
    ApiQuery({
      name: 'sortBy',
      required: false,
      type: String,
      description: 'Field to sort by',
    }),
    ApiQuery({
      name: 'sortOrder',
      required: false,
      enum: ['asc', 'desc'],
      description: 'Sort order',
    }),
  );
}

/**
 * Decorator for standard get by ID endpoints
 */
export function ApiGetById(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ...CRUD_RESPONSES.GET.map((r) => ApiResponse(r)),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Resource ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
}

/**
 * Decorator for standard create endpoints
 */
export function ApiCreate(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ...CRUD_RESPONSES.CREATE.map((r) => ApiResponse(r)),
  );
}

/**
 * Decorator for standard update endpoints
 */
export function ApiUpdate(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ...CRUD_RESPONSES.UPDATE.map((r) => ApiResponse(r)),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Resource ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
}

/**
 * Decorator for standard delete endpoints
 */
export function ApiDelete(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ...CRUD_RESPONSES.DELETE.map((r) => ApiResponse(r)),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Resource ID',
      example: '123e4567-e89b-12d3-a456-426614174000',
    }),
  );
}

/**
 * Decorator for custom endpoints with standard auth responses
 */
export function ApiCustomEndpoint(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiBearerAuth('JWT-auth'),
    ApiResponse({
      status: 200,
      description: 'Operation successful',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
    }),
    ApiResponse({
      status: 429,
      description: 'Too many requests',
    }),
  );
}

/**
 * Decorator for public endpoints (no auth required)
 */
export function ApiPublicEndpoint(summary: string, description?: string) {
  return applyDecorators(
    ApiOperation({ summary, description }),
    ApiResponse({
      status: 200,
      description: 'Operation successful',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request',
    }),
    ApiResponse({
      status: 429,
      description: 'Too many requests',
    }),
  );
}
