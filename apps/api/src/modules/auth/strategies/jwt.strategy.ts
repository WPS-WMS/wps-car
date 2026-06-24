import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { JwtPayload } from '../interfaces/authenticated-user.interface';
import { JwtUserLoaderService } from '../services/jwt-user-loader.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly jwtUserLoader: JwtUserLoaderService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token de acesso inválido');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { tokenVersion: true, active: true },
    });

    if (!dbUser?.active) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    const tokenVersion = payload.tokenVersion ?? 0;
    if (dbUser.tokenVersion !== tokenVersion) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    const user = await this.jwtUserLoader.loadById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    return user;
  }
}
