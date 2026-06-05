import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForUser(userId: string, role: UserRole): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true },
    });

    const userOverrides = await this.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    const codes = new Set(rolePermissions.map((rp) => rp.permission.code));

    for (const override of userOverrides) {
      if (override.granted) {
        codes.add(override.permission.code);
      } else {
        codes.delete(override.permission.code);
      }
    }

    return Array.from(codes).sort();
  }
}
