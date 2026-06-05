import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';

@Injectable()
export class TenantBranchesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  findMany(activeOnly?: boolean) {
    return this.prisma.tenantBranch.findMany({
      where: { tenantId: this.tenantId(), ...(activeOnly && { active: true }) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.tenantBranch.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  create(data: {
    name: string;
    address?: string;
    phone?: string;
    sortOrder?: number;
    active?: boolean;
  }) {
    return this.prisma.tenantBranch.create({
      data: { tenantId: this.tenantId(), ...data },
    });
  }

  update(
    id: string,
    data: Partial<{
      name: string;
      address: string | null;
      phone: string | null;
      sortOrder: number;
      active: boolean;
    }>,
  ) {
    return this.prisma.tenantBranch.update({ where: { id }, data });
  }
}
