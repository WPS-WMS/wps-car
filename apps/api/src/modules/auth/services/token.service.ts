import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../interfaces/authenticated-user.interface';
import { TokenPair } from '../interfaces/token-pair.interface';

type TokenUser = {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tokenVersion: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  generateAccessToken(payload: Omit<JwtPayload, 'type'>): string {
    return this.jwtService.sign(
      { ...payload, type: 'access' },
      {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: this.config.getOrThrow<string>('jwt.accessExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  generateRefreshToken(payload: Omit<JwtPayload, 'type'>): string {
    return this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.config.getOrThrow<string>('jwt.refreshExpiresIn') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  generateTwoFactorPendingToken(user: TokenUser): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tokenVersion: user.tokenVersion,
        type: '2fa_pending',
      },
      {
        secret: this.config.getOrThrow<string>('jwt.accessSecret'),
        expiresIn: '5m',
      },
    );
  }

  verifyTwoFactorPendingToken(token: string): JwtPayload {
    const payload = this.jwtService.verify<JwtPayload>(token, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
    });

    if (payload.type !== '2fa_pending') {
      throw new Error('Token 2FA inválido');
    }

    return payload;
  }

  generatePair(user: TokenUser): TokenPair {
    const base = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tokenVersion: user.tokenVersion,
    };

    return {
      accessToken: this.generateAccessToken(base),
      refreshToken: this.generateRefreshToken(base),
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') ?? '15m',
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  verifyRefreshToken(token: string): JwtPayload {
    const payload = this.jwtService.verify<JwtPayload>(token, {
      secret: this.config.getOrThrow<string>('jwt.refreshSecret'),
    });

    if (payload.type !== 'refresh') {
      throw new Error('Token inválido');
    }

    return payload;
  }
}
