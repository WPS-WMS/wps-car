import { Injectable } from '@nestjs/common';
import { CustomerType, UserRole } from '@prisma/client';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import {
  toCustomerHistoryResponse,
  toCustomerResponse,
} from '../../common/mappers/customer.mapper';
import {
  inferPersonType,
  isValidDocument,
  normalizeDocument,
} from '../../common/utils/document.util';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { AddHistoryNoteDto } from './dto/add-history-note.dto';
import { CustomersRepository } from './repositories/customers.repository';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async findAll(query: ListCustomersQueryDto, actor: AuthenticatedUser) {
    const sellerFilter =
      actor.role === UserRole.SELLER ? { assignedSellerId: actor.id } : undefined;

    const { data, total, page, limit } =
      await this.customersRepository.findManyPaginated(query, sellerFilter);

    return new PaginatedResponseDto(
      data.map(toCustomerResponse),
      total,
      page,
      limit,
    );
  }

  async findById(id: string, actor: AuthenticatedUser) {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new DomainException('CUSTOMER_NOT_FOUND', 'Cliente não encontrado', 404);
    }

    this.assertSellerAccess(customer.assignedSellerId, actor);
    return toCustomerResponse(customer);
  }

  async create(dto: CreateCustomerDto, actor: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    const document = normalizeDocument(dto.document);

    if (!isValidDocument(document)) {
      throw new DomainException('INVALID_DOCUMENT', 'CPF ou CNPJ inválido');
    }

    const existing = await this.customersRepository.findByDocument(document);
    if (existing) {
      throw new DomainException('DOCUMENT_ALREADY_EXISTS', 'Documento já cadastrado', 409);
    }

    let assignedSellerId = dto.assignedSellerId;
    if (actor.role === UserRole.SELLER) {
      assignedSellerId = actor.id;
    } else if (assignedSellerId) {
      await this.assertSellerInTenant(assignedSellerId, tenantId);
    }

    const personType = dto.personType ?? inferPersonType(document);

    const customer = await this.customersRepository.create({
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
      customerType: dto.customerType ?? CustomerType.BUYER,
      notes: dto.notes,
      assignedSellerId,
      active: true,
      createdById: actor.id,
      updatedById: actor.id,
    });

    return toCustomerResponse(customer);
  }

  async update(id: string, dto: UpdateCustomerDto, actor: AuthenticatedUser) {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new DomainException('CUSTOMER_NOT_FOUND', 'Cliente não encontrado', 404);
    }

    this.assertSellerAccess(customer.assignedSellerId, actor);

    if (actor.role === UserRole.SELLER && dto.assignedSellerId && dto.assignedSellerId !== actor.id) {
      throw new DomainException(
        'SELLER_CANNOT_REASSIGN',
        'Vendedor não pode reatribuir cliente a outro vendedor',
        403,
      );
    }

    let document = customer.document;
    if (dto.document) {
      document = normalizeDocument(dto.document);
      if (!isValidDocument(document)) {
        throw new DomainException('INVALID_DOCUMENT', 'CPF ou CNPJ inválido');
      }
      if (document !== customer.document) {
        const existing = await this.customersRepository.findByDocument(document);
        if (existing && existing.id !== id) {
          throw new DomainException('DOCUMENT_ALREADY_EXISTS', 'Documento já cadastrado', 409);
        }
      }
    }

    if (dto.assignedSellerId) {
      await this.assertSellerInTenant(
        dto.assignedSellerId,
        this.tenantContext.requireTenantId(),
      );
    }

    const personType =
      dto.personType ?? (dto.document ? inferPersonType(document) : undefined);

    const updated = await this.customersRepository.update(
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
        customerType: dto.customerType,
        notes: dto.notes,
        assignedSellerId: dto.assignedSellerId,
        active: dto.active,
        updatedById: actor.id,
      },
      actor.id,
    );

    return toCustomerResponse(updated);
  }

  async deactivate(id: string, actor: AuthenticatedUser) {
    return this.update(id, { active: false }, actor);
  }

  async getHistory(id: string, page = 1, limit = 20, actor: AuthenticatedUser) {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new DomainException('CUSTOMER_NOT_FOUND', 'Cliente não encontrado', 404);
    }

    this.assertSellerAccess(customer.assignedSellerId, actor);

    const { data, total, page: p, limit: l } =
      await this.customersRepository.findHistory(id, page, limit);

    return new PaginatedResponseDto(
      data.map(toCustomerHistoryResponse),
      total,
      p,
      l,
    );
  }

  async addNote(id: string, dto: AddHistoryNoteDto, actor: AuthenticatedUser) {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new DomainException('CUSTOMER_NOT_FOUND', 'Cliente não encontrado', 404);
    }

    this.assertSellerAccess(customer.assignedSellerId, actor);

    const entry = await this.customersRepository.addHistoryNote(
      id,
      customer.tenantId,
      dto.note,
      actor.id,
    );

    return toCustomerHistoryResponse(entry);
  }

  private assertSellerAccess(assignedSellerId: string | null, actor: AuthenticatedUser) {
    if (actor.role === UserRole.SELLER && assignedSellerId !== actor.id) {
      throw new DomainException(
        'CUSTOMER_ACCESS_DENIED',
        'Cliente não vinculado a este vendedor',
        403,
      );
    }
  }

  private async assertSellerInTenant(userId: string, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        active: true,
        role: { in: [UserRole.SELLER, UserRole.MANAGER, UserRole.ADMIN] },
      },
    });

    if (!user) {
      throw new DomainException(
        'INVALID_ASSIGNED_SELLER',
        'Vendedor responsável inválido',
        400,
      );
    }
  }
}
