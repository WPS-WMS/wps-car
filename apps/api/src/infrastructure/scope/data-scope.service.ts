import { Injectable } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';

export type ScopeFilters = {
  branchId?: string;
  sellerId?: string;
};

@Injectable()
export class DataScopeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  parseBranchFilter(value?: string): string | null | undefined {
    if (value === undefined || value === '' || value === 'all') {
      return undefined;
    }
    if (value === 'matriz') {
      return null;
    }
    return value;
  }

  async buildVehicleScope(
    actor: AuthenticatedUser,
    filters: ScopeFilters = {},
  ): Promise<Prisma.VehicleWhereInput> {
    if (actor.role === UserRole.MANAGER || actor.role === UserRole.SELLER) {
      return { branchId: actor.branchId ?? null };
    }

    const branchFilter = this.parseBranchFilter(filters.branchId);
    if (branchFilter !== undefined) {
      return { branchId: branchFilter };
    }

    return {};
  }

  assertVehicleAccess(
    vehicle: { branchId: string | null },
    actor: AuthenticatedUser,
  ) {
    if (actor.role === UserRole.ADMIN) {
      return;
    }

    if ((vehicle.branchId ?? null) !== (actor.branchId ?? null)) {
      throw new DomainException(
        'SCOPE_ACCESS_DENIED',
        'Registro fora do escopo da sua filial',
        403,
      );
    }
  }

  async resolveVehicleBranchId(
    actor: AuthenticatedUser,
    requestedBranchId?: string,
  ): Promise<string | null> {
    if (actor.role === UserRole.MANAGER || actor.role === UserRole.SELLER) {
      return actor.branchId ?? null;
    }

    const branchFilter = this.parseBranchFilter(requestedBranchId);
    if (branchFilter === undefined) {
      return null;
    }

    if (branchFilter !== null) {
      const tenantId = this.tenantContext.requireTenantId();
      const branch = await this.prisma.tenantBranch.findFirst({
        where: { id: branchFilter, tenantId, active: true },
        select: { id: true },
      });

      if (!branch) {
        throw new DomainException('BRANCH_NOT_FOUND', 'Filial não encontrada', 404);
      }
    }

    return branchFilter;
  }

  async buildSaleScope(
    actor: AuthenticatedUser,
    filters: ScopeFilters = {},
  ): Promise<Prisma.SaleWhereInput> {
    const tenantId = this.tenantContext.requireTenantId();

    if (actor.role === UserRole.SELLER) {
      return { sellerId: actor.id };
    }

    if (actor.role === UserRole.MANAGER) {
      const branchId = actor.branchId ?? null;
      if (filters.sellerId) {
        await this.assertUserInBranch(filters.sellerId, branchId, tenantId);
        return { sellerId: filters.sellerId };
      }
      return { seller: { branchId } };
    }

    if (filters.sellerId) {
      await this.assertUserInTenant(filters.sellerId, tenantId);
      return { sellerId: filters.sellerId };
    }

    const branchFilter = this.parseBranchFilter(filters.branchId);
    if (branchFilter !== undefined) {
      return { seller: { branchId: branchFilter } };
    }

    return {};
  }

  async assertSaleAccess(saleSellerId: string, actor: AuthenticatedUser) {
    if (actor.role === UserRole.SELLER) {
      if (saleSellerId !== actor.id) {
        throw new DomainException('SALE_ACCESS_DENIED', 'Venda de outro vendedor', 403);
      }
      return;
    }

    if (actor.role === UserRole.MANAGER) {
      const tenantId = this.tenantContext.requireTenantId();
      await this.assertUserInBranch(
        saleSellerId,
        actor.branchId ?? null,
        tenantId,
      );
    }
  }

  private async assertUserInBranch(
    userId: string,
    branchId: string | null,
    tenantId: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, active: true },
      select: { branchId: true },
    });

    if (!user || (user.branchId ?? null) !== branchId) {
      throw new DomainException(
        'SCOPE_ACCESS_DENIED',
        'Registro fora do escopo da sua filial',
        403,
      );
    }
  }

  private async assertUserInTenant(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, active: true },
      select: { id: true },
    });

    if (!user) {
      throw new DomainException('SELLER_NOT_FOUND', 'Usuário não encontrado', 404);
    }
  }
}
