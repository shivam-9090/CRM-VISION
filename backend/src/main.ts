import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS for cross-platform development
  app.enableCors({
    origin: [
      configService.get('FRONTEND_URL') || 'http://localhost:3000',
      /^http:\/\/192\.168\.[0-9]+\.[0-9]+:3000$/,  // Local network
      /^http:\/\/10\.[0-9]+\.[0-9]+\.[0-9]+:3000$/,   // Corporate network
      /^http:\/\/172\.[0-9]+\.[0-9]+\.[0-9]+:3000$/,  // Docker network
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
  // Listen on all interfaces for cross-platform access
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend running on: http://0.0.0.0:${port}`);
  console.log(`📡 API available at: http://0.0.0.0:${port}/api`);
  console.log(`🌐 Cross-platform ready - Use your workspace IP to connect from other devices`);
}
bootstrap();
