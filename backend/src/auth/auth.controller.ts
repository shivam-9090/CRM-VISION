import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InviteDto } from './dto/invite.dto';
import { AuthGuard } from './guards/auth.guard';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';

import { RegisterWithInviteDto } from './dto/register-with-invite.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registrations per minute
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(registerDto, res);
  }

  @Post('register/invite')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async registerWithInvite(
    @Body() registerWithInviteDto: RegisterWithInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.registerWithInvite(registerWithInviteDto, res);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(loginDto, res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @UseGuards(AuthGuard)
  @Get('verify')
  async verify(@Request() req) {
    return { user: req.user };
  }

  @Post('invite')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('user:invite')
  async generateInvite(@Body() inviteDto: InviteDto) {
    const token = await this.authService.generateInviteToken(inviteDto);
    return { inviteToken: token };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req) {
    return req.user;
  }
}