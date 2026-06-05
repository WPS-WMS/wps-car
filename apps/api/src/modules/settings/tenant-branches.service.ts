import { Injectable } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { CreateTenantBranchDto } from './dto/create-tenant-branch.dto';
import { UpdateTenantBranchDto } from './dto/update-tenant-branch.dto';
import { TenantBranchesRepository } from './repositories/tenant-branches.repository';

@Injectable()
export class TenantBranchesService {
  constructor(private readonly repository: TenantBranchesRepository) {}

  list(activeOnly?: boolean) {
    return this.repository.findMany(activeOnly).then((rows) =>
      rows.map((b) => ({
        id: b.id,
        tenantId: b.tenantId,
        name: b.name,
        address: b.address,
        phone: b.phone,
        active: b.active,
        sortOrder: b.sortOrder,
      })),
    );
  }

  async create(dto: CreateTenantBranchDto) {
    const branch = await this.repository.create({
      name: dto.name.trim(),
      address: dto.address?.trim() || undefined,
      phone: dto.phone?.trim() || undefined,
      sortOrder: dto.sortOrder ?? 0,
      active: dto.active ?? true,
    });
    return this.toResponse(branch);
  }

  async update(id: string, dto: UpdateTenantBranchDto) {
    await this.assertExists(id);
    const branch = await this.repository.update(id, {
      ...(dto.name !== undefined && { name: dto.name.trim() }),
      ...(dto.address !== undefined && { address: dto.address?.trim() || null }),
      ...(dto.phone !== undefined && { phone: dto.phone?.trim() || null }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.active !== undefined && { active: dto.active }),
    });
    return this.toResponse(branch);
  }

  async deactivate(id: string) {
    await this.assertExists(id);
    const branch = await this.repository.update(id, { active: false });
    return this.toResponse(branch);
  }

  private async assertExists(id: string) {
    const row = await this.repository.findById(id);
    if (!row) {
      throw new DomainException('BRANCH_NOT_FOUND', 'Filial não encontrada', 404);
    }
  }

  private toResponse(branch: {
    id: string;
    tenantId: string;
    name: string;
    address: string | null;
    phone: string | null;
    active: boolean;
    sortOrder: number;
  }) {
    return {
      id: branch.id,
      tenantId: branch.tenantId,
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      active: branch.active,
      sortOrder: branch.sortOrder,
    };
  }
}
