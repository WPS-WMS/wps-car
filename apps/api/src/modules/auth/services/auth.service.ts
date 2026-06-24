import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { AuditAction, User } from '@prisma/client';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import { AuditRequestMeta } from '../../../common/utils/audit-request.util';
import { hashToken } from '../../../common/utils/hash.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { AuditService } from '../../audit/audit.service';
import { EmailDispatchService } from '../../notifications/email-dispatch.service';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/auth-response.dto';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtUserLoaderService } from './jwt-user-loader.service';
import { PermissionsService } from './permissions.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly permissionsService: PermissionsService,
    private readonly jwtUserLoader: JwtUserLoaderService,
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
    private readonly emailDispatch: EmailDispatchService,
    private readonly audit: AuditService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  async login(dto: LoginDto, meta: AuditRequestMeta = {}): Promise<LoginResponseDto> {
    let user: User;

    try {
      user = await this.findUserForLogin(dto);
    } catch {
      await this.audit.log({
        action: AuditAction.AUTH_LOGIN_FAILED,
        metadata: { email: dto.email.trim().toLowerCase() },
        ...meta,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.active) {
      await this.audit.log({
        action: AuditAction.AUTH_LOGIN_FAILED,
        userId: user.id,
        tenantId: user.tenantId,
        metadata: { reason: 'inactive' },
        ...meta,
      });
      throw new DomainException('USER_INACTIVE', 'Usuário inativo', 403);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.audit.log({
        action: AuditAction.AUTH_LOGIN_FAILED,
        userId: user.id,
        tenantId: user.tenantId,
        metadata: { reason: 'invalid_password' },
        ...meta,
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (this.twoFactor.requiresTwoFactor(user)) {
      return {
        requiresTwoFactor: true,
        twoFactorToken: this.tokenService.generateTwoFactorPendingToken({
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
          tokenVersion: user.tokenVersion,
        }),
        expiresIn: '5m',
      };
    }

    return this.issueLoginResponse(user, meta);
  }

  async verifyTwoFactor(
    twoFactorToken: string,
    code: string,
    meta: AuditRequestMeta = {},
  ): Promise<LoginResponseDto> {
    let payload;
    try {
      payload = this.tokenService.verifyTwoFactorPendingToken(twoFactorToken);
    } catch {
      throw new UnauthorizedException('Sessão 2FA expirada. Faça login novamente.');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user?.active || user.tokenVersion !== (payload.tokenVersion ?? 0)) {
      throw new UnauthorizedException('Sessão 2FA inválida');
    }

    try {
      await this.twoFactor.verifyLoginCode(user.id, code);
    } catch {
      await this.audit.log({
        action: AuditAction.AUTH_2FA_FAILED,
        userId: user.id,
        tenantId: user.tenantId,
        ...meta,
      });
      throw new UnauthorizedException('Código inválido ou expirado');
    }

    return this.issueLoginResponse(user, meta);
  }

  async refresh(refreshToken: string): Promise<LoginResponseDto> {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!stored) {
      const revoked = await this.prisma.refreshToken.findFirst({
        where: { tokenHash, userId: payload.sub, revokedAt: { not: null } },
      });

      if (revoked) {
        await this.handleRefreshReuse(payload.sub, revoked.familyId, revoked.tenantId);
      }

      throw new UnauthorizedException('Refresh token revogado ou inexistente');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário inválido');
    }

    const tokenVersion = payload.tokenVersion ?? 0;
    if (user.tokenVersion !== tokenVersion) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const permissions = await this.permissionsService.resolveForUser(
      user.id,
      user.role,
      user.tenantId,
    );

    const tokens = this.tokenService.generatePair({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tokenVersion: user.tokenVersion,
    });

    await this.persistRefreshToken(user, tokens.refreshToken, stored.familyId ?? undefined);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        permissions,
      },
    };
  }

  async logout(
    refreshToken: string,
    userId: string,
    meta: AuditRequestMeta = {},
  ): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    await this.audit.log({
      action: AuditAction.AUTH_LOGOUT,
      userId,
      tenantId: user?.tenantId,
      ...meta,
    });
  }

  async logoutAll(userId: string, meta: AuditRequestMeta = {}): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await this.bumpTokenVersion(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    });

    await this.audit.log({
      action: AuditAction.AUTH_LOGOUT_ALL,
      userId,
      tenantId: user?.tenantId,
      ...meta,
    });
  }

  async validateUserById(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.jwtUserLoader.loadById(userId);

    if (!user) {
      return null;
    }

    this.tenantContext.setTenantId(user.tenantId);
    this.tenantContext.setUserId(user.id);

    return user;
  }

  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = await this.prisma.user.findMany({
      where: { email: normalizedEmail },
    });

    const genericMessage =
      'Se o e-mail existir em nossa base, enviaremos instruções de recuperação.';

    if (users.length !== 1) {
      return { message: genericMessage };
    }

    const user = users[0];
    if (!user.active) {
      return { message: genericMessage };
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresMinutes =
      this.config.get<number>('auth.passwordResetExpiresMinutes') ?? 60;
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt,
      },
    });

    const webAppUrl = this.config.get<string>('webAppUrl') ?? 'http://localhost:3000';
    const resetLink = `${webAppUrl.replace(/\/$/, '')}/redefinir-senha#token=${rawToken}`;
    const companyName = await this.resolveCompanyName(user.tenantId);

    await this.emailDispatch.sendTypedEmail({
      tenantId: user.tenantId,
      code: 'password_reset',
      to: user.email,
      force: true,
      variables: {
        userName: user.name,
        userEmail: user.email,
        companyName,
        resetLink,
        resetExpiresMinutes: expiresMinutes,
      },
    });

    return { message: genericMessage };
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
    meta: AuditRequestMeta = {},
  ) {
    const tokenHash = hashToken(token.trim());
    const stored = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored || !stored.user.active) {
      throw new DomainException(
        'INVALID_RESET_TOKEN',
        'Link inválido ou expirado. Solicite uma nova recuperação de senha.',
        400,
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: stored.userId },
        data: {
          passwordHash,
          tokenVersion: { increment: 1 },
        },
      });

      await tx.passwordResetToken.update({
        where: { id: stored.id },
        data: { usedAt: new Date() },
      });

      await tx.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await this.jwtUserLoader.invalidate(stored.userId);

    await this.audit.log({
      action: AuditAction.AUTH_PASSWORD_RESET,
      userId: stored.userId,
      tenantId: stored.user.tenantId,
      ...meta,
    });

    return { message: 'Senha redefinida com sucesso. Faça login com a nova senha.' };
  }

  private async issueLoginResponse(
    user: User,
    meta: AuditRequestMeta,
  ): Promise<LoginResponseDto> {
    const permissions = await this.permissionsService.resolveForUser(
      user.id,
      user.role,
      user.tenantId,
    );

    const tokens = this.tokenService.generatePair({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tokenVersion: user.tokenVersion,
    });

    await this.persistRefreshToken(user, tokens.refreshToken);

    await this.audit.log({
      action: AuditAction.AUTH_LOGIN_SUCCESS,
      userId: user.id,
      tenantId: user.tenantId,
      ...meta,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        permissions,
      },
    };
  }

  private async handleRefreshReuse(
    userId: string,
    familyId: string | null,
    tenantId: string | null,
  ) {
    if (familyId) {
      await this.prisma.refreshToken.updateMany({
        where: { familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.bumpTokenVersion(userId);
    await this.jwtUserLoader.invalidate(userId);

    await this.audit.log({
      action: AuditAction.AUTH_REFRESH_REUSE,
      userId,
      tenantId,
      metadata: { familyId },
    });
  }

  private async bumpTokenVersion(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    await this.jwtUserLoader.invalidate(userId);
  }

  private async resolveCompanyName(tenantId: string | null) {
    if (!tenantId) return 'WPS Car';

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    return tenant?.name ?? 'WPS Car';
  }

  private async findUserForLogin(dto: LoginDto): Promise<User> {
    if (dto.tenantCnpj) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { cnpj: dto.tenantCnpj },
      });

      if (!tenant) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
        throw new DomainException('TENANT_INACTIVE', 'Empresa inativa ou suspensa', 403);
      }

      const user = await this.prisma.user.findFirst({
        where: { email: dto.email, tenantId: tenant.id },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      return user;
    }

    const users = await this.prisma.user.findMany({
      where: { email: dto.email },
    });

    if (users.length === 0) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (users.length > 1) {
      throw new UnauthorizedException(
        'Este e-mail está cadastrado em mais de uma empresa. Contate o administrador.',
      );
    }

    const user = users[0];

    if (user.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantId },
      });

      if (!tenant) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
        throw new DomainException('TENANT_INACTIVE', 'Empresa inativa ou suspensa', 403);
      }
    }

    return user;
  }

  private async persistRefreshToken(
    user: User,
    refreshToken: string,
    existingFamilyId?: string,
  ) {
    const expiresIn = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const expiresAt = this.parseExpiresAt(expiresIn);
    const familyId = existingFamilyId ?? randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash: hashToken(refreshToken),
        familyId,
        expiresAt,
      },
    });
  }

  private parseExpiresAt(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    const now = Date.now();

    if (!match) {
      return new Date(now + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(now + value * (multipliers[unit] ?? multipliers.d));
  }
}
