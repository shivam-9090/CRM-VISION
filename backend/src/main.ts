import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { validateEnvironment } from './config/env.validation';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  // Validate environment variables before starting the app
  validateEnvironment();

  // Initialize Sentry for error monitoring (production only)
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [nodeProfilingIntegration()],
      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% of transactions
      // Profiling
      profilesSampleRate: 0.1, // 10% of transactions
    });
    console.log('🔍 Sentry error monitoring initialized');
  }

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enhanced security headers with Helmet
  const isProduction = configService.get('NODE_ENV') === 'production';
  app.use(
    helmet({
      // Strict Transport Security (HSTS) - Force HTTPS for 1 year
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
      },
      // Content Security Policy (CSP)
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for Swagger UI
          scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for Swagger UI
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: isProduction ? [] : null, // Force HTTPS upgrade in production
        },
      },
      // Prevent clickjacking
      frameguard: {
        action: 'deny',
      },
      // Prevent MIME type sniffing
      noSniff: true,
      // Disable X-Powered-By header
      hidePoweredBy: true,
      // Referrer Policy
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
    }),
  );

  // Permissions Policy (manual header - not yet in Helmet stable)
  app.use((req, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=()',
    );
    next();
  });

  // Enable CORS for cross-platform development
  // In production, only allow HTTPS origins
  const allowedOrigins = isProduction
    ? [
        configService.get('FRONTEND_URL') || 'https://your-domain.com',
        // Add production HTTPS domains here
      ]
    : [
        configService.get('FRONTEND_URL') || 'http://localhost:3000',
        /^http:\/\/192\.168\.[0-9]+\.[0-9]+:3000$/, // Local network
        /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:3000$/, // Corporate network
        /^http:\/\/172\.[0-9]+\.[0-9]+\.[0-9]+:3000$/, // Docker network
      ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());

  // Request timeout middleware (30 seconds)
  app.use((req: Request, res: Response, next: NextFunction) => {
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

  // Configure Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('CRM System API')
    .setDescription(
      'Comprehensive CRM system with user management, companies, contacts, deals, and activities',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'CRM API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .topbar-wrapper .link { content: url('data:image/png;base64,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'); background-size: 120px 25px; }
      .swagger-ui .topbar { display: none; }
    `,
  });

  const port = configService.get('PORT') || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(
    `🔒 Rate limiting enabled: ${configService.get('NODE_ENV') === 'production' ? '100' : '200'} requests per minute`,
  );
  console.log(`🔐 Security: Enhanced password requirements (12+ chars)`);
  console.log(`📊 Database: Performance indexes added`);
  console.log(`📄 Pagination: Enabled on all list endpoints (max 100/page)`);
  console.log(`❤️  Health check: Available at /api/health`);
  console.log(`⏱️  Request timeout: 30 seconds`);
  if (isProduction) {
    console.log(`🔗 Connection pooling: 10 connections, 20s timeout`);
    console.log(`🛡️  HTTPS enforced with HSTS (max-age: 1 year)`);
    console.log(`🔒 Security headers: CSP, Frame Guard, No Sniff enabled`);
    console.log(`⚠️  HTTP requests will be redirected to HTTPS`);
  }
}

void bootstrap();
