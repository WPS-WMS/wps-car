import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../interfaces/authenticated-user.interface';
import { TokenPair } from '../interfaces/token-pair.interface';

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

  generatePair(user: {
    id: string;
    email: string;
    role: UserRole;
    tenantId: string | null;
  }): TokenPair {
    const base = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
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
