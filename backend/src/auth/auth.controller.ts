import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Request,
  Res,
  Req,
} from '@nestjs/common';
import type { Response, Request as ExpressRequest } from 'express';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InviteDto } from './dto/invite.dto';
import { AuthGuard } from './guards/auth.guard';
import { Permissions } from './decorators/permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { RegisterWithInviteDto } from './dto/register-with-invite.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password-reset.dto';
import { SWAGGER_RESPONSES } from '../common/swagger/swagger-responses';
import { ApiPublicEndpoint } from '../common/swagger/swagger-decorators';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 registrations per minute
  @ApiOperation({
    summary: 'Register new company and admin user',
    description: 'Create a new company with admin user account',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Registration successful, returns JWT token and user data',
  })
  @ApiResponse(SWAGGER_RESPONSES.BAD_REQUEST_400)
  @ApiResponse(SWAGGER_RESPONSES.CONFLICT_409)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(registerDto, res);
  }

  @Post('register/invite')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({
    summary: 'Register with invite token',
    description: 'Join existing company using an invite token',
  })
  @ApiBody({ type: RegisterWithInviteDto })
  @ApiResponse({
    status: 201,
    description: 'Registration successful, user added to company',
  })
  @ApiResponse(SWAGGER_RESPONSES.BAD_REQUEST_400)
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async registerWithInvite(
    @Body() registerWithInviteDto: RegisterWithInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.registerWithInvite(registerWithInviteDto, res);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 login attempts per minute
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and get access token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 201,
    description: 'Login successful, returns JWT token and user data',
  })
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(loginDto, res);
  }

  @Post('logout')
  @ApiPublicEndpoint('User logout', 'Clear authentication cookies and logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 refreshes per minute
  @ApiOperation({
    summary: 'Refresh access token using refresh token',
    description: 'Get new access token without re-authenticating',
  })
  @ApiResponse({
    status: 200,
    description: 'New access token generated successfully',
  })
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async refreshToken(
    @Body() body: { refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshAccessToken(body.refreshToken, res);
  }

  @Post('revoke')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke a specific refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Refresh token revoked successfully',
  })
  async revokeToken(@Body() body: { refreshToken: string }) {
    return this.authService.revokeRefreshToken(body.refreshToken);
  }

  @Post('revoke-all')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke all refresh tokens for current user' })
  @ApiResponse({
    status: 200,
    description: 'All refresh tokens revoked successfully',
  })
  async revokeAllTokens(@Request() req) {
    return this.authService.revokeAllRefreshTokens(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get('verify')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Verify JWT token',
    description: 'Check if current JWT token is valid',
  })
  @ApiResponse({
    status: 200,
    description: 'Token is valid, returns user data',
  })
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  async verify(@Request() req) {
    return { user: req.user };
  }

  @Post('invite')
  @UseGuards(AuthGuard, PermissionsGuard)
  @Permissions('user:invite')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Generate invite token',
    description: 'Create an invitation for new user to join company',
  })
  @ApiBody({ type: InviteDto })
  @ApiResponse({
    status: 201,
    description: 'Invite token generated successfully',
  })
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.FORBIDDEN_403)
  async generateInvite(@Body() inviteDto: InviteDto) {
    const token = await this.authService.generateInviteToken(inviteDto);
    return { inviteToken: token };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user data' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing JWT token',
  })
  async getProfile(@Request() req) {
    return req.user;
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email to user',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if account exists',
  })
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 attempts per minute
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Set new password using reset token from email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse(SWAGGER_RESPONSES.UNAUTHORIZED_401)
  @ApiResponse(SWAGGER_RESPONSES.TOO_MANY_REQUESTS_429)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent if account exists',
  })
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  // 2FA endpoints
  @Post('2fa/enable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Enable Two-Factor Authentication' })
  @ApiResponse({
    status: 200,
    description: 'Returns QR code and secret for 2FA setup',
  })
  async enableTwoFactor(@Request() req) {
    return this.authService.enableTwoFactor(req.user.id);
  }

  @Post('2fa/verify')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify and activate Two-Factor Authentication' })
  @ApiResponse({ status: 200, description: '2FA enabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid 2FA token' })
  async verifyTwoFactor(@Request() req, @Body() body: { token: string }) {
    return this.authService.verifyAndEnableTwoFactor(req.user.id, body.token);
  }

  @Post('2fa/disable')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Disable Two-Factor Authentication' })
  @ApiResponse({ status: 200, description: '2FA disabled successfully' })
  @ApiResponse({ status: 401, description: 'Invalid password' })
  async disableTwoFactor(@Request() req, @Body() body: { password: string }) {
    return this.authService.disableTwoFactor(req.user.id, body.password);
  }
}
