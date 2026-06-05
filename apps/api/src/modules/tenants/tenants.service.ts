import { Injectable } from '@nestjs/common';
import { TenantStatus } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { normalizeCnpj, isValidCnpjLength } from '../../common/utils/document.util';
import { toTenantResponse } from '../../common/mappers/tenant.mapper';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { TenantsRepository } from './repositories/tenants.repository';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  async findAll(query: ListTenantsQueryDto) {
    const { data, total, page, limit } =
      await this.tenantsRepository.findManyPaginated(query);

    return new PaginatedResponseDto(
      data.map(toTenantResponse),
      total,
      page,
      limit,
    );
  }

  async findById(id: string) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new DomainException('TENANT_NOT_FOUND', 'Empresa não encontrada', 404);
    }
    return toTenantResponse(tenant);
  }

  async create(dto: CreateTenantDto) {
    const cnpj = normalizeCnpj(dto.cnpj);
    if (!isValidCnpjLength(cnpj)) {
      throw new DomainException('INVALID_CNPJ', 'CNPJ inválido');
    }

    const existing = await this.tenantsRepository.findByCnpj(cnpj);
    if (existing) {
      throw new DomainException('CNPJ_ALREADY_EXISTS', 'CNPJ já cadastrado', 409);
    }

    const tenant = await this.tenantsRepository.create({
      name: dto.name,
      cnpj,
      email: dto.email,
      phone: dto.phone,
      status: dto.status ?? TenantStatus.TRIAL,
      plan: dto.plan,
    });

    return toTenantResponse(tenant);
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findById(id);

    if (dto.cnpj) {
      const cnpj = normalizeCnpj(dto.cnpj);
      if (!isValidCnpjLength(cnpj)) {
        throw new DomainException('INVALID_CNPJ', 'CNPJ inválido');
      }
      const existing = await this.tenantsRepository.findByCnpj(cnpj);
      if (existing && existing.id !== id) {
        throw new DomainException('CNPJ_ALREADY_EXISTS', 'CNPJ já cadastrado', 409);
      }
      dto.cnpj = cnpj;
    }

    const tenant = await this.tenantsRepository.update(id, {
      name: dto.name,
      cnpj: dto.cnpj,
      email: dto.email,
      phone: dto.phone,
      status: dto.status,
      plan: dto.plan,
    });

    return toTenantResponse(tenant);
  }

  async getCurrent(tenantId: string) {
    return this.findById(tenantId);
  }

  async updateCurrent(tenantId: string, dto: UpdateTenantDto) {
    const { status, plan, cnpj, ...safeDto } = dto;

    if (status !== undefined || plan !== undefined || cnpj !== undefined) {
      throw new DomainException(
        'TENANT_FIELD_FORBIDDEN',
        'Status, plano e CNPJ só podem ser alterados pela plataforma',
        403,
      );
    }

    const tenant = await this.tenantsRepository.update(tenantId, safeDto);
    return toTenantResponse(tenant);
  }
}
