import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { auditMetaFromRequest } from '../../common/utils/audit-request.util';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTenant } from '../../common/decorators/skip-tenant.decorator';
import { ForgotPasswordDto, ResetPasswordWithTokenDto } from './dto/password-reset.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  DisableTwoFactorDto,
  TwoFactorCodeDto,
  VerifyTwoFactorDto,
} from './dto/two-factor.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './services/auth.service';
import { TwoFactorService } from './services/two-factor.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, auditMetaFromRequest(req));
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('2fa/verify')
  @HttpCode(HttpStatus.OK)
  verifyTwoFactor(@Body() dto: VerifyTwoFactorDto, @Req() req: Request) {
    return this.authService.verifyTwoFactor(
      dto.twoFactorToken,
      dto.code,
      auditMetaFromRequest(req),
    );
  }

  @Public()
  @Throttle({ auth: { limit: 20, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Throttle({ auth: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordWithTokenDto, @Req() req: Request) {
    return this.authService.resetPasswordWithToken(
      dto.token,
      dto.newPassword,
      auditMetaFromRequest(req),
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
  ) {
    await this.authService.logout(dto.refreshToken, user.id, auditMetaFromRequest(req));
    return { message: 'Logout realizado' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    await this.authService.logoutAll(user.id, auditMetaFromRequest(req));
    return { message: 'Todas as sessões encerradas' };
  }

  @Get('2fa/status')
  @SkipTenant()
  getTwoFactorStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.twoFactorService.getStatus(user.id);
  }

  @Post('2fa/setup')
  @SkipTenant()
  setupTwoFactor(@CurrentUser() user: AuthenticatedUser) {
    return this.twoFactorService.setup(user);
  }

  @Post('2fa/enable')
  @SkipTenant()
  enableTwoFactor(@CurrentUser() user: AuthenticatedUser, @Body() dto: TwoFactorCodeDto) {
    return this.twoFactorService.enable(user, dto.code);
  }

  @Post('2fa/disable')
  @SkipTenant()
  disableTwoFactor(@CurrentUser() user: AuthenticatedUser, @Body() dto: DisableTwoFactorDto) {
    return this.twoFactorService.disable(user, dto.code, dto.password);
  }

  @Get('me')
  @SkipTenant()
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
