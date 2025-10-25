export function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
  ];

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

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    warnings.push('JWT_SECRET is less than 32 characters. Consider using a stronger secret.');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Environment Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }

  // Throw error if critical variables are missing
  if (missing.length > 0) {
    const errorMessage = `❌ Missing required environment variables:\n${missing.map(v => `   - ${v}`).join('\n')}`;
    throw new Error(errorMessage);
  }

  console.log('✅ Environment validation passed');
}
