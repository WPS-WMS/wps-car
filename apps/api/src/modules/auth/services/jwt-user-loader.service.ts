import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { PermissionsService } from './permissions.service';

/** Singleton usado pelo Passport JWT (não pode depender de providers request-scoped). */
@Injectable()
export class JwtUserLoaderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async loadById(userId: string): Promise<AuthenticatedUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.active) {
      return null;
    }

    const permissions = await this.permissionsService.resolveForUser(
      user.id,
      user.role,
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      permissions,
    };
  }
}
