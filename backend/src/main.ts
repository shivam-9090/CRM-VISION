import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { validateEnvironment } from './config/env.validation';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  // Validate environment variables before starting the app
  validateEnvironment();

  // Initialize Sentry for error monitoring (production only)
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        nodeProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Profiling
      profilesSampleRate: 0.1, // 10% of transactions
    });
    console.log('🔍 Sentry error monitoring initialized');
  }

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security headers
  app.use(helmet());

  // Enable CORS for cross-platform development
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL') || 'http://localhost:3000',
      /^http:\/\/192\.168\.[0-9]+\.[0-9]+:3000$/, // Local network
      /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:3000$/, // Corporate network
      /^http:\/\/172\.[0-9]+\.[0-9]+\.[0-9]+:3000$/, // Docker network
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  // Request timeout middleware (30 seconds)
  app.use((req, res, next) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          statusCode: 504,
          message: 'Request timeout - operation took too long',
          error: 'Gateway Timeout',
        });
      }
    }, 30000); // 30 seconds

    res.on('finish', () => clearTimeout(timeout));
    res.on('close', () => clearTimeout(timeout));
    next();
  });

  // Enable global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Set global API prefix
  app.setGlobalPrefix('api');

  const port = configService.get('PORT') || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(
    `🔒 Rate limiting enabled: ${configService.get('NODE_ENV') === 'production' ? '100' : '10'} requests per minute`,
  );
  console.log(
    `🔐 Security: Enhanced password requirements (12+ chars)`,
  );
  console.log(`📊 Database: Performance indexes added`);
  console.log(
    `📄 Pagination: Enabled on all list endpoints (max 100/page)`,
  );
  console.log(`❤️  Health check: Available at /api/health`);
  console.log(`⏱️  Request timeout: 30 seconds`);
  if (configService.get('NODE_ENV') === 'production') {
    console.log(`🔗 Connection pooling: 10 connections, 20s timeout`);
  }
}

void bootstrap();