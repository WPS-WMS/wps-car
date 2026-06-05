import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { ListTenantsQueryDto } from '../dto/list-tenants-query.dto';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findManyPaginated(query: ListTenantsQueryDto) {
    const { page, limit, skip, orderBy } = resolvePagination(query);

    const where: Prisma.TenantWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.plan && { plan: query.plan }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { cnpj: { contains: query.search.replace(/\D/g, '') } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async findByCnpj(cnpj: string) {
    return this.prisma.tenant.findUnique({ where: { cnpj } });
  }

  async create(data: Prisma.TenantCreateInput) {
    return this.prisma.tenant.create({ data });
  }

  async update(id: string, data: Prisma.TenantUpdateInput) {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  async countActiveUsers(tenantId: string) {
    return this.prisma.user.count({
      where: { tenantId, active: true },
    });
  }
}
