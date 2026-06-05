import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@prisma/client';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { hashToken } from '../../../common/utils/hash.util';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/auth-response.dto';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { JwtUserLoaderService } from './jwt-user-loader.service';
import { PermissionsService } from './permissions.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly permissionsService: PermissionsService,
    private readonly jwtUserLoader: JwtUserLoaderService,
    private readonly tenantContext: TenantContextService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.findUserForLogin(dto);

    if (!user.active) {
      throw new DomainException('USER_INACTIVE', 'Usuário inativo', 403);
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const permissions = await this.permissionsService.resolveForUser(
      user.id,
      user.role,
    );

    const tokens = this.tokenService.generatePair({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    await this.persistRefreshToken(user, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        permissions,
      },
    };
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
      throw new UnauthorizedException('Refresh token revogado ou inexistente');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário inválido');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const permissions = await this.permissionsService.resolveForUser(
      user.id,
      user.role,
    );

    const tokens = this.tokenService.generatePair({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    await this.persistRefreshToken(user, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        permissions,
      },
    };
  }

  async logout(refreshToken: string, userId: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
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

  private async findUserForLogin(dto: LoginDto): Promise<User> {
    if (dto.tenantCnpj) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { cnpj: dto.tenantCnpj },
      });

      if (!tenant) {
        throw new UnauthorizedException('Empresa não encontrada');
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

    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, role: UserRole.MODERATOR, tenantId: null },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Informe o CNPJ da empresa ou use conta de moderador',
      );
    }

    return user;
  }

  private async persistRefreshToken(user: User, refreshToken: string) {
    const expiresIn = this.config.get<string>('jwt.refreshExpiresIn') ?? '7d';
    const expiresAt = this.parseExpiresAt(expiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash: hashToken(refreshToken),
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
