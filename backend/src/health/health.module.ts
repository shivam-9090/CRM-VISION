import { Module } from '@nestjs/common';
import { SimpleHealthController } from './simple-health.controller';

@Module({
  controllers: [SimpleHealthController],
})
export class HealthModule {}
