import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

/**
 * Environment variable validation with security checks
 * Enforces required variables, validates formats, and prevents insecure configurations
 */
export function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

  // Additional required vars for production
  const productionRequired = [
    'SENTRY_DSN',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
  ];

  const missing: string[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Production-specific required variables - make them warnings instead to allow free tier deployment
  if (process.env.NODE_ENV === 'production') {
    for (const envVar of productionRequired) {
      if (!process.env[envVar]) {
        warnings.push(
          `${envVar} not configured - some features will be disabled`,
        );
      }
    }
  }

  // Validate JWT_SECRET strength (minimum 32 chars for production, 32 for dev)
  if (process.env.JWT_SECRET) {
    const minLength = process.env.NODE_ENV === 'production' ? 32 : 32;
    if (process.env.JWT_SECRET.length < minLength) {
      errors.push(
        `JWT_SECRET must be at least ${minLength} characters (current: ${process.env.JWT_SECRET.length})`,
      );
    }

    // Check for default/example secrets
    const insecurePatterns = [
      'DO_NOT_SHARE',
      'secret',
      'password',
      'test',
      'example',
      '12345',
    ];
    const lowerSecret = process.env.JWT_SECRET.toLowerCase();
    for (const pattern of insecurePatterns) {
      if (lowerSecret.includes(pattern.toLowerCase())) {
        if (process.env.NODE_ENV === 'production') {
          errors.push(
            `JWT_SECRET contains insecure pattern: "${pattern}". Use a cryptographically random secret.`,
          );
        } else {
          warnings.push(
            `JWT_SECRET contains pattern "${pattern}" - acceptable for dev, but change for production`,
          );
        }
      }
    }
  }

  // Validate DATABASE_URL format and security
  if (process.env.DATABASE_URL) {
    try {
      const dbUrl = new URL(process.env.DATABASE_URL);

      // Check for localhost in production
      if (
        process.env.NODE_ENV === 'production' &&
        (dbUrl.hostname === 'localhost' || dbUrl.hostname === '127.0.0.1')
      ) {
        errors.push(
          'DATABASE_URL points to localhost in production - must use production database host',
        );
      }

      // Warn about weak database passwords
      if (dbUrl.password && dbUrl.password.length < 16) {
        warnings.push(
          `Database password is short (${dbUrl.password.length} chars). Recommended: 16+ characters.`,
        );
      }

      // Check for default passwords
      const weakPasswords = ['password', 'admin', '1234', 'postgres'];
      if (
        dbUrl.password &&
        weakPasswords.includes(dbUrl.password.toLowerCase())
      ) {
        if (process.env.NODE_ENV === 'production') {
          errors.push('Database password is using a common/weak password');
        } else {
          warnings.push('Database password is weak - acceptable for dev only');
        }
      }

      // Validate connection pool parameters in URL
      const searchParams = new URLSearchParams(dbUrl.search);
      const connectionLimit = searchParams.get('connection_limit');
      const poolTimeout = searchParams.get('pool_timeout');

      if (connectionLimit) {
        const limit = parseInt(connectionLimit, 10);
        if (isNaN(limit) || limit < 1) {
          errors.push(
            `connection_limit in DATABASE_URL must be >= 1, got: ${connectionLimit}`,
          );
        } else if (limit > 100) {
          warnings.push(
            `connection_limit is very high (${limit}). PostgreSQL default max_connections is 100. Ensure your database can handle this.`,
          );
        }
      }

      if (poolTimeout) {
        const timeout = parseInt(poolTimeout, 10);
        if (isNaN(timeout) || timeout < 1) {
          errors.push(
            `pool_timeout in DATABASE_URL must be >= 1, got: ${poolTimeout}`,
          );
        }
      }
    } catch {
      errors.push('DATABASE_URL is not a valid URL format');
    }
  }

  // Validate connection pool environment variables
  if (process.env.DB_POOL_SIZE) {
    const poolSize = parseInt(process.env.DB_POOL_SIZE, 10);
    if (isNaN(poolSize) || poolSize < 1) {
      errors.push(
        `DB_POOL_SIZE must be a positive integer, got: ${process.env.DB_POOL_SIZE}`,
      );
    } else if (poolSize > 50) {
      warnings.push(
        `DB_POOL_SIZE is very high (${poolSize}). Ensure your database and application can handle this load.`,
      );
    } else if (poolSize < 5 && process.env.NODE_ENV === 'production') {
      warnings.push(
        `DB_POOL_SIZE is low (${poolSize}) for production. Consider increasing to 10-20 for better performance.`,
      );
    }
  }

  if (process.env.DB_POOL_TIMEOUT) {
    const timeout = parseInt(process.env.DB_POOL_TIMEOUT, 10);
    if (isNaN(timeout) || timeout < 1) {
      errors.push(
        `DB_POOL_TIMEOUT must be a positive integer (seconds), got: ${process.env.DB_POOL_TIMEOUT}`,
      );
    } else if (timeout < 10 && process.env.NODE_ENV === 'production') {
      warnings.push(
        `DB_POOL_TIMEOUT is low (${timeout}s). Recommended: 20s or higher for production.`,
      );
    }
  }

  if (process.env.DB_CONNECTION_LIMIT) {
    const limit = parseInt(process.env.DB_CONNECTION_LIMIT, 10);
    if (isNaN(limit) || limit < 1) {
      errors.push(
        `DB_CONNECTION_LIMIT must be a positive integer, got: ${process.env.DB_CONNECTION_LIMIT}`,
      );
    }
  }

  if (process.env.DB_POOL_MIN) {
    const min = parseInt(process.env.DB_POOL_MIN, 10);
    if (isNaN(min) || min < 0) {
      errors.push(
        `DB_POOL_MIN must be a non-negative integer, got: ${process.env.DB_POOL_MIN}`,
      );
    }
    if (process.env.DB_POOL_SIZE) {
      const poolSize = parseInt(process.env.DB_POOL_SIZE, 10);
      if (min > poolSize) {
        errors.push(
          `DB_POOL_MIN (${min}) cannot be greater than DB_POOL_SIZE (${poolSize})`,
        );
      }
    }
  }

  // Validate PORT
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(
        `PORT must be a valid port number (1-65535), got: ${process.env.PORT}`,
      );
    }
  } else {
    warnings.push('PORT not set, defaulting to 3001');
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test', 'staging'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    warnings.push(
      `NODE_ENV is "${process.env.NODE_ENV}" but should be one of: ${validEnvs.join(', ')}`,
    );
  } else if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development');
  }

  // Validate FRONTEND_URL
  if (process.env.FRONTEND_URL) {
    try {
      new URL(process.env.FRONTEND_URL);
    } catch {
      warnings.push('FRONTEND_URL is not a valid URL format');
    }
  } else {
    warnings.push('FRONTEND_URL not set, using default CORS settings');
  }

  // Validate Sentry DSN if provided
  if (process.env.SENTRY_DSN) {
    try {
      new URL(process.env.SENTRY_DSN);
    } catch {
      warnings.push('SENTRY_DSN is not a valid URL format');
    }
  } else {
    // Make Sentry optional even in production for free tier deployment
    warnings.push(
      'SENTRY_DSN not set - error tracking and monitoring disabled',
    );
  }

  // Validate email configuration
  if (process.env.SMTP_PORT) {
    const smtpPort = parseInt(process.env.SMTP_PORT, 10);
    if (isNaN(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      warnings.push(
        `SMTP_PORT must be a valid port number, got: ${process.env.SMTP_PORT}`,
      );
    }
  }

  // Redis configuration
  if (process.env.REDIS_PORT) {
    const redisPort = parseInt(process.env.REDIS_PORT, 10);
    if (isNaN(redisPort) || redisPort < 1 || redisPort > 65535) {
      warnings.push(
        `REDIS_PORT must be a valid port number, got: ${process.env.REDIS_PORT}`,
      );
    }
  }

  // Warn if Redis password not set in production
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_PASSWORD) {
    warnings.push(
      'REDIS_PASSWORD not set in production - Redis should be password-protected',
    );
  }

  // Production security checklist
  if (process.env.NODE_ENV === 'production') {
    logger.log('🔒 Production Security Checklist:');
    logger.log(
      `  ✓ JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`,
    );
    logger.log(
      `  ✓ DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`,
    );
    logger.log(
      `  ✓ Connection Pool: ${process.env.DB_POOL_SIZE || '10'} connections (timeout: ${process.env.DB_POOL_TIMEOUT || '20'}s)`,
    );
    logger.log(
      `  ✓ SENTRY_DSN: ${process.env.SENTRY_DSN ? '✅ Set' : '❌ Missing'}`,
    );
    logger.log(
      `  ✓ Email Config: ${process.env.SMTP_HOST ? '✅ Set' : '❌ Missing'}`,
    );
    logger.log(
      `  ✓ Redis Password: ${process.env.REDIS_PASSWORD ? '✅ Set' : '⚠️ Not Set'}`,
    );
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('⚠️  Environment Warnings:');
    warnings.forEach((warning) => logger.warn(`   - ${warning}`));
  }

  // Log errors
  if (errors.length > 0) {
    logger.error('❌ Environment Errors:');
    errors.forEach((error) => logger.error(`   - ${error}`));
  }

  // Throw error if critical variables are missing or errors exist
  if (missing.length > 0 || errors.length > 0) {
    const allErrors = [
      ...missing.map((v) => `Missing required variable: ${v}`),
      ...errors,
    ];
    const errorMessage = `❌ Environment validation failed:\n${allErrors.map((e) => `   - ${e}`).join('\n')}`;
    throw new Error(errorMessage);
  }

  logger.log('✅ Environment validation passed');
}
