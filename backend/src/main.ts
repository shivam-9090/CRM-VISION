import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
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
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api`);
}
bootstrap();
