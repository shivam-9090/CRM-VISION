import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SanitizerService } from '../common/sanitizer.service';
import { EmailService } from '../common/email.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, SanitizerService, EmailService],
  exports: [UserService],
})
export class UserModule {}
