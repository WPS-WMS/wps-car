import { Injectable } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import {
  toSupplierHistoryResponse,
  toSupplierResponse,
} from '../../common/mappers/supplier.mapper';
import {
  inferPersonType,
  isValidDocument,
  normalizeDocument,
} from '../../common/utils/document.util';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { AddHistoryNoteDto } from '../customers/dto/add-history-note.dto';
import { SuppliersRepository } from './repositories/suppliers.repository';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly suppliersRepository: SuppliersRepository,
    private readonly tenantContext: TenantContextService,
  ) {}

  async findAll(query: ListSuppliersQueryDto) {
    const { data, total, page, limit } =
      await this.suppliersRepository.findManyPaginated(query);

    return new PaginatedResponseDto(
      data.map(toSupplierResponse),
      total,
      page,
      limit,
    );
  }

  async findById(id: string) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) {
      throw new DomainException('SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado', 404);
    }
    return toSupplierResponse(supplier);
  }

  async create(dto: CreateSupplierDto, actor: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    const document = normalizeDocument(dto.document);

    if (!isValidDocument(document)) {
      throw new DomainException('INVALID_DOCUMENT', 'CPF ou CNPJ inválido');
    }

    const existing = await this.suppliersRepository.findByDocument(document);
    if (existing) {
      throw new DomainException('DOCUMENT_ALREADY_EXISTS', 'Documento já cadastrado', 409);
    }

    const personType = dto.personType ?? inferPersonType(document);

    const supplier = await this.suppliersRepository.create({
      tenantId,
      name: dto.name,
      document,
      phone: dto.phone,
      email: dto.email?.toLowerCase(),
      street: dto.street,
      number: dto.number,
      complement: dto.complement,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state?.toUpperCase(),
      zipCode: dto.zipCode,
      personType,
      category: dto.category,
      notes: dto.notes,
      active: true,
      createdById: actor.id,
      updatedById: actor.id,
    });

    return toSupplierResponse(supplier);
  }

  async update(id: string, dto: UpdateSupplierDto, actor: AuthenticatedUser) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) {
      throw new DomainException('SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado', 404);
    }

    let document = supplier.document;
    if (dto.document) {
      document = normalizeDocument(dto.document);
      if (!isValidDocument(document)) {
        throw new DomainException('INVALID_DOCUMENT', 'CPF ou CNPJ inválido');
      }
      if (document !== supplier.document) {
        const existing = await this.suppliersRepository.findByDocument(document);
        if (existing && existing.id !== id) {
          throw new DomainException('DOCUMENT_ALREADY_EXISTS', 'Documento já cadastrado', 409);
        }
      }
    }

    const personType =
      dto.personType ?? (dto.document ? inferPersonType(document) : undefined);

    const updated = await this.suppliersRepository.update(
      id,
      {
        name: dto.name,
        document: dto.document ? document : undefined,
        phone: dto.phone,
        email: dto.email?.toLowerCase(),
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state?.toUpperCase(),
        zipCode: dto.zipCode,
        personType,
        category: dto.category,
        notes: dto.notes,
        active: dto.active,
        updatedById: actor.id,
      },
      actor.id,
    );

    return toSupplierResponse(updated);
  }

  async deactivate(id: string, actor: AuthenticatedUser) {
    return this.update(id, { active: false }, actor);
  }

  async getPurchasedVehicles(id: string) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) {
      throw new DomainException('SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado', 404);
    }

    const tenantId = this.tenantContext.requireTenantId();
    const records = await this.suppliersRepository.findPurchasesBySupplier(
      id,
      tenantId,
    );

    return records;
  }

  async getHistory(id: string, page = 1, limit = 20) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) {
      throw new DomainException('SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado', 404);
    }

    const { data, total, page: p, limit: l } =
      await this.suppliersRepository.findHistory(id, page, limit);

    return new PaginatedResponseDto(
      data.map(toSupplierHistoryResponse),
      total,
      p,
      l,
    );
  }

  async addNote(id: string, dto: AddHistoryNoteDto, actor: AuthenticatedUser) {
    const supplier = await this.suppliersRepository.findById(id);
    if (!supplier) {
      throw new DomainException('SUPPLIER_NOT_FOUND', 'Fornecedor não encontrado', 404);
    }

    const entry = await this.suppliersRepository.addHistoryNote(
      id,
      supplier.tenantId,
      dto.note,
      actor.id,
    );

    return toSupplierHistoryResponse(entry);
  }
}
