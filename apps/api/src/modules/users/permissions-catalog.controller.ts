import { Controller, Get } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('permissions')
export class PermissionsCatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions('users:update')
  async listAll() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });

    return permissions.map((p) => ({
      id: p.id,
      code: p.code,
      module: p.module,
      description: p.description,
    }));
  }
}
