export function validateEnvironment() {
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  // Check optional but recommended variables
  if (!process.env.PORT) {
    warnings.push('PORT not set, defaulting to 3001');
  }

  if (!process.env.NODE_ENV) {
    warnings.push('NODE_ENV not set, defaulting to development');
  }

  if (!process.env.FRONTEND_URL) {
    warnings.push('FRONTEND_URL not set, using default CORS settings');
  }

  // Monitoring and logging
  if (!process.env.SENTRY_DSN) {
    warnings.push(
      'SENTRY_DSN not set - error tracking and monitoring disabled',
    );
  }

  // Email configuration (for production)
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      warnings.push(
        'Email configuration incomplete - email notifications will fail',
      );
    }
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push(
      'JWT_SECRET is less than 32 characters. Consider using a stronger secret.',
    );
  }

  // Production-specific validation
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.SENTRY_DSN) {
      console.error(
        '❌ CRITICAL: SENTRY_DSN must be set in production for error monitoring',
      );
    }

    // Warn about development values in production
    if (
      process.env.JWT_SECRET?.includes('DO_NOT_SHARE') ||
      process.env.DATABASE_URL?.includes('localhost')
    ) {
      console.error(
        '❌ CRITICAL: Development configuration detected in production environment',
      );
      throw new Error(
        'Production environment must not use development configuration',
      );
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment Warnings:');
    warnings.forEach((warning) => console.warn(`   - ${warning}`));
  }

  // Throw error if critical variables are missing
  if (missing.length > 0) {
    const errorMessage = `❌ Missing required environment variables:\n${missing.map((v) => `   - ${v}`).join('\n')}`;
    throw new Error(errorMessage);
  }

  console.log('✅ Environment validation passed');
}
