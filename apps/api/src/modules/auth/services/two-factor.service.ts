import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditAction, User, UserRole } from '@prisma/client';
import { generateSecret, generateURI, verify } from 'otplib';
import { decryptSecret, encryptSecret } from '../../../common/utils/secret-cipher.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

const TWO_FACTOR_ROLES = new Set<UserRole>([UserRole.ADMIN, UserRole.MODERATOR]);

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  isEligible(role: UserRole) {
    return TWO_FACTOR_ROLES.has(role);
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totpEnabled: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      eligible: this.isEligible(user.role),
      enabled: user.totpEnabled,
    };
  }

  async setup(actor: AuthenticatedUser) {
    this.assertEligible(actor.role);

    const secret = generateSecret();
    const encrypted = encryptSecret(
      secret,
      this.config.getOrThrow<string>('jwt.accessSecret'),
    );

    await this.prisma.user.update({
      where: { id: actor.id },
      data: {
        totpSecret: encrypted,
        totpEnabled: false,
      },
    });

    const issuer = this.config.get<string>('webAppUrl') ?? 'WPS Car';
    const otpauthUrl = generateURI({
      issuer: issuer.replace(/^https?:\/\//, ''),
      label: actor.email,
      secret,
    });

    return {
      secret,
      otpauthUrl,
    };
  }

  async enable(actor: AuthenticatedUser, code: string) {
    this.assertEligible(actor.role);

    const user = await this.requireUserWithSecret(actor.id);
    await this.verifyCode(user, code);

    await this.prisma.user.update({
      where: { id: actor.id },
      data: { totpEnabled: true },
    });

    await this.audit.log({
      action: AuditAction.AUTH_2FA_ENABLED,
      userId: actor.id,
      tenantId: actor.tenantId,
    });

    return { message: 'Autenticação em duas etapas ativada' };
  }

  async disable(actor: AuthenticatedUser, code: string, password: string) {
    this.assertEligible(actor.role);

    const user = await this.requireUserWithSecret(actor.id);
    const validPassword = await import('bcrypt').then((bcrypt) =>
      bcrypt.compare(password, user.passwordHash),
    );

    if (!validPassword) {
      throw new UnauthorizedException('Senha incorreta');
    }

    await this.verifyCode(user, code);

    await this.prisma.user.update({
      where: { id: actor.id },
      data: {
        totpEnabled: false,
        totpSecret: null,
      },
    });

    await this.audit.log({
      action: AuditAction.AUTH_2FA_DISABLED,
      userId: actor.id,
      tenantId: actor.tenantId,
    });

    return { message: 'Autenticação em duas etapas desativada' };
  }

  async verifyLoginCode(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.totpEnabled || !user.totpSecret) {
      throw new BadRequestException('2FA não está ativo para este usuário');
    }

    await this.verifyCode(user, code);
  }

  requiresTwoFactor(user: Pick<User, 'role' | 'totpEnabled'>) {
    return user.totpEnabled && this.isEligible(user.role);
  }

  private assertEligible(role: UserRole) {
    if (!this.isEligible(role)) {
      throw new ForbiddenException(
        'Autenticação em duas etapas disponível apenas para administradores e moderadores',
      );
    }
  }

  private async requireUserWithSecret(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecret) {
      throw new BadRequestException('Configure o 2FA antes de confirmar');
    }
    return user;
  }

  private async verifyCode(user: Pick<User, 'totpSecret'>, code: string) {
    if (!user.totpSecret) {
      throw new BadRequestException('2FA não configurado');
    }

    const secret = decryptSecret(
      user.totpSecret,
      this.config.getOrThrow<string>('jwt.accessSecret'),
    );

    const result = await verify({ token: code.replace(/\s/g, ''), secret });
    if (!result.valid) {
      throw new UnauthorizedException('Código inválido ou expirado');
    }
  }
}
