import { ApiResponseOptions } from '@nestjs/swagger';

/**
 * Common Swagger response schemas
 * Used across all controllers for consistent API documentation
 */

export const SWAGGER_RESPONSES = {
  // Success responses
  SUCCESS_200: {
    description: 'Operation successful',
    status: 200,
  } as ApiResponseOptions,

  CREATED_201: {
    description: 'Resource created successfully',
    status: 201,
  } as ApiResponseOptions,

  NO_CONTENT_204: {
    description: 'Resource deleted successfully',
    status: 204,
  } as ApiResponseOptions,

  // Client error responses
  BAD_REQUEST_400: {
    description: 'Bad request - Invalid input data',
    status: 400,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
          example: ['email must be a valid email address'],
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  } as ApiResponseOptions,

  UNAUTHORIZED_401: {
    description: 'Unauthorized - Authentication required',
    status: 401,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  } as ApiResponseOptions,

  FORBIDDEN_403: {
    description: 'Forbidden - Insufficient permissions',
    status: 403,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: {
          type: 'string',
          example: 'Forbidden - Insufficient permissions',
        },
      },
    },
  } as ApiResponseOptions,

  NOT_FOUND_404: {
    description: 'Resource not found',
    status: 404,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Resource not found' },
      },
    },
  } as ApiResponseOptions,

  CONFLICT_409: {
    description: 'Conflict - Resource already exists',
    status: 409,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'User with this email already exists',
        },
      },
    },
  } as ApiResponseOptions,

  UNPROCESSABLE_ENTITY_422: {
    description: 'Unprocessable entity - Business logic validation failed',
    status: 422,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 422 },
        message: {
          type: 'string',
          example: 'Cannot delete user with active deals',
        },
      },
    },
  } as ApiResponseOptions,

  TOO_MANY_REQUESTS_429: {
    description: 'Too many requests - Rate limit exceeded',
    status: 429,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: {
          type: 'string',
          example: 'ThrottlerException: Too Many Requests',
        },
      },
    },
  } as ApiResponseOptions,

  // Server error responses
  INTERNAL_SERVER_ERROR_500: {
    description: 'Internal server error',
    status: 500,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Internal server error' },
      },
    },
  } as ApiResponseOptions,

  GATEWAY_TIMEOUT_504: {
    description: 'Request timeout - Operation took too long',
    status: 504,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 504 },
        message: {
          type: 'string',
          example: 'Request timeout - operation took too long',
        },
        error: { type: 'string', example: 'Gateway Timeout' },
      },
    },
  } as ApiResponseOptions,
};

/**
 * Common response decorators for typical CRUD operations
 */
export const CRUD_RESPONSES = {
  LIST: [
    SWAGGER_RESPONSES.SUCCESS_200,
    SWAGGER_RESPONSES.UNAUTHORIZED_401,
    SWAGGER_RESPONSES.FORBIDDEN_403,
    SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429,
  ],

  GET: [
    SWAGGER_RESPONSES.SUCCESS_200,
    SWAGGER_RESPONSES.UNAUTHORIZED_401,
    SWAGGER_RESPONSES.FORBIDDEN_403,
    SWAGGER_RESPONSES.NOT_FOUND_404,
    SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429,
  ],

  CREATE: [
    SWAGGER_RESPONSES.CREATED_201,
    SWAGGER_RESPONSES.BAD_REQUEST_400,
    SWAGGER_RESPONSES.UNAUTHORIZED_401,
    SWAGGER_RESPONSES.FORBIDDEN_403,
    SWAGGER_RESPONSES.CONFLICT_409,
    SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429,
  ],

  UPDATE: [
    SWAGGER_RESPONSES.SUCCESS_200,
    SWAGGER_RESPONSES.BAD_REQUEST_400,
    SWAGGER_RESPONSES.UNAUTHORIZED_401,
    SWAGGER_RESPONSES.FORBIDDEN_403,
    SWAGGER_RESPONSES.NOT_FOUND_404,
    SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429,
  ],

  DELETE: [
    SWAGGER_RESPONSES.NO_CONTENT_204,
    SWAGGER_RESPONSES.UNAUTHORIZED_401,
    SWAGGER_RESPONSES.FORBIDDEN_403,
    SWAGGER_RESPONSES.NOT_FOUND_404,
    SWAGGER_RESPONSES.UNPROCESSABLE_ENTITY_422,
    SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429,
  ],
};
