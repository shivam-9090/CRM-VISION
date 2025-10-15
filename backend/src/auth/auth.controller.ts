import { Body, Controller, Post, UseGuards, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InviteDto } from './dto/invite.dto';
import { AuthGuard } from './guards/auth.guard';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
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