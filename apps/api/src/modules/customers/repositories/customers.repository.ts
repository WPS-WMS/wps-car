import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { ListCustomersQueryDto } from '../dto/list-customers-query.dto';

const customerInclude = {
  assignedSeller: { select: { id: true, name: true, email: true } },
} satisfies Prisma.CustomerInclude;

@Injectable()
export class CustomersRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  buildWhere(
    query: ListCustomersQueryDto,
    options?: { assignedSellerId?: string },
  ): Prisma.CustomerWhereInput {
    return {
      tenantId: this.tenantId(),
      ...(options?.assignedSellerId && {
        assignedSellerId: options.assignedSellerId,
      }),
      ...(query.assignedSellerId && { assignedSellerId: query.assignedSellerId }),
      ...(query.customerType && { customerType: query.customerType }),
      ...(query.active !== undefined && { active: query.active }),
      ...(query.search && {
        // Índices GIN pg_trgm (migration 20260618130000) aceleram ILIKE %term%
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { document: { contains: query.search.replace(/\D/g, '') } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
        ],
      }),
    };
  }

  async findManyPaginated(
    query: ListCustomersQueryDto,
    options?: { assignedSellerId?: string },
  ) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where = this.buildWhere(query, options);

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { name: 'asc' },
        include: customerInclude,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    return this.prisma.customer.findFirst({
      where: { id, tenantId: this.tenantId() },
      include: customerInclude,
    });
  }

  async findByDocument(document: string) {
    return this.prisma.customer.findFirst({
      where: { tenantId: this.tenantId(), document },
    });
  }

  async create(data: Prisma.CustomerUncheckedCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data,
        include: customerInclude,
      });

      await tx.customerHistory.create({
        data: {
          tenantId: customer.tenantId,
          customerId: customer.id,
          action: 'CREATED',
          userId: data.createdById,
          details: { name: customer.name, document: customer.document },
        },
      });

      return customer;
    });
  }

  async update(id: string, data: Prisma.CustomerUncheckedUpdateInput, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.update({
        where: { id },
        data,
        include: customerInclude,
      });

      await tx.customerHistory.create({
        data: {
          tenantId: customer.tenantId,
          customerId: customer.id,
          action: data.active === false ? 'DEACTIVATED' : 'UPDATED',
          userId: actorId,
          details: { fields: Object.keys(data).filter((k) => k !== 'updatedById') },
        },
      });

      return customer;
    });
  }

  async findHistory(customerId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where = { customerId, tenantId: this.tenantId() };

    const [data, total] = await Promise.all([
      this.prisma.customerHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customerHistory.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async addHistoryNote(
    customerId: string,
    tenantId: string,
    note: string,
    userId: string,
  ) {
    return this.prisma.customerHistory.create({
      data: {
        tenantId,
        customerId,
        action: 'NOTE',
        userId,
        details: { note },
      },
    });
  }
}
