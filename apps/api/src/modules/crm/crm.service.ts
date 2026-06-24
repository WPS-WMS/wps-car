import { Injectable } from '@nestjs/common';
import { ContactChannel, UserRole } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import {
  toFunnelResponse,
  toLeadContactResponse,
  toLeadDetailResponse,
  toLeadResponse,
  toLeadVehicleInterestResponse,
  toOpportunityResponse,
  toSellerReminderResponse,
} from './crm.mapper';
import { CreateLeadContactDto } from './dto/create-lead-contact.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateLeadInterestDto } from './dto/create-lead-interest.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { ListRemindersQueryDto } from './dto/list-reminders-query.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { CrmRepository } from './repositories/crm.repository';

@Injectable()
export class CrmService {
  constructor(
    private readonly crmRepository: CrmRepository,
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {}

  async findAllLeads(query: ListLeadsQueryDto, actor: AuthenticatedUser) {
    const sellerFilter = this.resolveSellerFilter(actor);
    const { data, total, page, limit } = await this.crmRepository.findLeadsPaginated(
      query,
      sellerFilter,
    );

    return new PaginatedResponseDto(
      data.map(toLeadResponse),
      total,
      page,
      limit,
    );
  }

  async findLeadById(id: string, actor: AuthenticatedUser) {
    const lead = await this.crmRepository.findLeadById(id);
    if (!lead) {
      throw new DomainException('LEAD_NOT_FOUND', 'Lead não encontrado', 404);
    }

    this.assertSellerAccess(lead.sellerId, actor);
    return toLeadDetailResponse(lead);
  }

  async createLead(dto: CreateLeadDto, actor: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    const sellerId = this.resolveSellerId(dto.sellerId, actor);

    if (sellerId) {
      await this.assertSellerInTenant(sellerId, tenantId);
    }

    if (dto.customerId) {
      await this.assertCustomer(dto.customerId);
    }

    const lead = await this.crmRepository.createLead({
      tenantId,
      name: dto.name,
      phone: dto.phone,
      email: dto.email?.toLowerCase(),
      source: dto.source,
      sellerId,
      customerId: dto.customerId,
      expectedAmount: dto.expectedAmount,
      notes: dto.notes,
      nextFollowUpAt: dto.nextFollowUpAt,
      createdById: actor.id,
    });

    await this.syncLeadFollowUpReminder(lead.id, lead.name, lead.sellerId, lead.nextFollowUpAt);

    return toLeadResponse(lead);
  }

  async updateLead(id: string, dto: UpdateLeadDto, actor: AuthenticatedUser) {
    const lead = await this.crmRepository.findLeadById(id);
    if (!lead) {
      throw new DomainException('LEAD_NOT_FOUND', 'Lead não encontrado', 404);
    }

    this.assertSellerAccess(lead.sellerId, actor);

    if (actor.role === UserRole.SELLER && dto.sellerId && dto.sellerId !== actor.id) {
      throw new DomainException(
        'SELLER_CANNOT_REASSIGN',
        'Vendedor não pode reatribuir lead a outro vendedor',
        403,
      );
    }

    const tenantId = this.tenantContext.requireTenantId();
    if (dto.sellerId) {
      await this.assertSellerInTenant(dto.sellerId, tenantId);
    }

    if (dto.customerId) {
      await this.assertCustomer(dto.customerId);
    }

    const updated = await this.crmRepository.updateLead(id, {
      name: dto.name,
      phone: dto.phone,
      email: dto.email?.toLowerCase(),
      source: dto.source,
      status: dto.status,
      sellerId: dto.sellerId,
      customerId: dto.customerId,
      expectedAmount: dto.expectedAmount,
      notes: dto.notes,
      ...(dto.nextFollowUpAt !== undefined && { nextFollowUpAt: dto.nextFollowUpAt }),
    });

    const nextFollowUpAt =
      dto.nextFollowUpAt !== undefined ? dto.nextFollowUpAt : updated.nextFollowUpAt;
    const sellerId = dto.sellerId !== undefined ? dto.sellerId : updated.sellerId;

    await this.syncLeadFollowUpReminder(
      updated.id,
      updated.name,
      sellerId,
      nextFollowUpAt,
    );

    return toLeadResponse(updated);
  }

  async createLeadContact(
    leadId: string,
    dto: CreateLeadContactDto,
    actor: AuthenticatedUser,
  ) {
    const lead = await this.crmRepository.findLeadById(leadId);
    if (!lead) {
      throw new DomainException('LEAD_NOT_FOUND', 'Lead não encontrado', 404);
    }

    this.assertSellerAccess(lead.sellerId, actor);

    const contact = await this.crmRepository.createLeadContact({
      tenantId: lead.tenantId,
      leadId,
      channel: dto.channel ?? ContactChannel.OTHER,
      summary: dto.summary,
      contactedAt: dto.contactedAt,
      userId: actor.id,
      metadata: dto.metadata as object | undefined,
    });

    return toLeadContactResponse(contact, { leadPhone: lead.phone });
  }

  async createLeadInterest(
    leadId: string,
    dto: CreateLeadInterestDto,
    actor: AuthenticatedUser,
  ) {
    const lead = await this.crmRepository.findLeadById(leadId);
    if (!lead) {
      throw new DomainException('LEAD_NOT_FOUND', 'Lead não encontrado', 404);
    }

    this.assertSellerAccess(lead.sellerId, actor);
    await this.assertVehicle(dto.vehicleId);

    const existing = await this.crmRepository.findLeadInterest(leadId, dto.vehicleId);
    if (existing) {
      throw new DomainException(
        'LEAD_INTEREST_EXISTS',
        'Lead já possui interesse neste veículo',
        409,
      );
    }

    const interest = await this.crmRepository.createLeadInterest({
      tenantId: lead.tenantId,
      leadId,
      vehicleId: dto.vehicleId,
      notes: dto.notes,
    });

    return toLeadVehicleInterestResponse(interest);
  }

  async getFunnel(actor: AuthenticatedUser) {
    const sellerId = actor.role === UserRole.SELLER ? actor.id : undefined;

    const [leadCounts, opportunityCounts] = await Promise.all([
      this.crmRepository.countLeadsByStatus(sellerId),
      this.crmRepository.countOpportunitiesByStatus(sellerId),
    ]);

    return toFunnelResponse(leadCounts, opportunityCounts);
  }

  async findAllOpportunities(
    query: ListOpportunitiesQueryDto,
    actor: AuthenticatedUser,
  ) {
    const sellerFilter = this.resolveSellerFilter(actor);
    const { data, total, page, limit } =
      await this.crmRepository.findOpportunitiesPaginated(query, sellerFilter);

    return new PaginatedResponseDto(
      data.map(toOpportunityResponse),
      total,
      page,
      limit,
    );
  }

  async createOpportunity(dto: CreateOpportunityDto, actor: AuthenticatedUser) {
    const tenantId = this.tenantContext.requireTenantId();
    const sellerId = this.resolveRequiredSellerId(dto.sellerId, actor);

    await this.assertSellerInTenant(sellerId, tenantId);
    await this.assertCustomer(dto.customerId);

    if (dto.vehicleId) {
      await this.assertVehicle(dto.vehicleId);
    }

    const opportunity = await this.crmRepository.createOpportunity({
      tenantId,
      customerId: dto.customerId,
      sellerId,
      vehicleId: dto.vehicleId,
      title: dto.title,
      amount: dto.amount,
      notes: dto.notes,
      nextFollowUpAt: dto.nextFollowUpAt,
    });

    await this.syncOpportunityFollowUpReminder(
      opportunity.id,
      opportunity.title,
      opportunity.sellerId,
      opportunity.nextFollowUpAt,
    );

    return toOpportunityResponse(opportunity);
  }

  async updateOpportunity(
    id: string,
    dto: UpdateOpportunityDto,
    actor: AuthenticatedUser,
  ) {
    const opportunity = await this.crmRepository.findOpportunityById(id);
    if (!opportunity) {
      throw new DomainException('OPPORTUNITY_NOT_FOUND', 'Oportunidade não encontrada', 404);
    }

    this.assertSellerAccess(opportunity.sellerId, actor);

    if (actor.role === UserRole.SELLER && dto.sellerId && dto.sellerId !== actor.id) {
      throw new DomainException(
        'SELLER_CANNOT_REASSIGN',
        'Vendedor não pode reatribuir oportunidade a outro vendedor',
        403,
      );
    }

    const tenantId = this.tenantContext.requireTenantId();
    if (dto.sellerId) {
      await this.assertSellerInTenant(dto.sellerId, tenantId);
    }

    if (dto.customerId) {
      await this.assertCustomer(dto.customerId);
    }

    if (dto.vehicleId) {
      await this.assertVehicle(dto.vehicleId);
    }

    const updated = await this.crmRepository.updateOpportunity(id, {
      customerId: dto.customerId,
      sellerId: dto.sellerId,
      vehicleId: dto.vehicleId,
      title: dto.title,
      amount: dto.amount,
      status: dto.status,
      notes: dto.notes,
      ...(dto.nextFollowUpAt !== undefined && { nextFollowUpAt: dto.nextFollowUpAt }),
    });

    const nextFollowUpAt =
      dto.nextFollowUpAt !== undefined ? dto.nextFollowUpAt : updated.nextFollowUpAt;
    const sellerId = dto.sellerId !== undefined ? dto.sellerId : updated.sellerId;

    await this.syncOpportunityFollowUpReminder(
      updated.id,
      updated.title,
      sellerId,
      nextFollowUpAt,
    );

    return toOpportunityResponse(updated);
  }

  async findAllReminders(query: ListRemindersQueryDto, actor: AuthenticatedUser) {
    const userFilter =
      actor.role === UserRole.SELLER ? { userId: actor.id } : undefined;

    const { data, total, page, limit } = await this.crmRepository.findRemindersPaginated(
      query,
      userFilter,
    );

    return new PaginatedResponseDto(
      data.map(toSellerReminderResponse),
      total,
      page,
      limit,
    );
  }

  async completeReminder(id: string, actor: AuthenticatedUser) {
    const reminder = await this.crmRepository.findReminderById(id);
    if (!reminder) {
      throw new DomainException('REMINDER_NOT_FOUND', 'Lembrete não encontrado', 404);
    }

    if (actor.role === UserRole.SELLER && reminder.userId !== actor.id) {
      throw new DomainException(
        'REMINDER_ACCESS_DENIED',
        'Lembrete não pertence a este vendedor',
        403,
      );
    }

    const completed = await this.crmRepository.completeReminder(id);
    return toSellerReminderResponse(completed);
  }

  private resolveSellerFilter(actor: AuthenticatedUser) {
    return actor.role === UserRole.SELLER ? { sellerId: actor.id } : undefined;
  }

  private resolveSellerId(
    sellerId: string | undefined,
    actor: AuthenticatedUser,
  ): string | undefined {
    if (actor.role === UserRole.SELLER) {
      return actor.id;
    }
    return sellerId;
  }

  private resolveRequiredSellerId(
    sellerId: string | undefined,
    actor: AuthenticatedUser,
  ): string {
    if (actor.role === UserRole.SELLER) {
      return actor.id;
    }
    if (!sellerId) {
      throw new DomainException('SELLER_REQUIRED', 'Vendedor é obrigatório', 400);
    }
    return sellerId;
  }

  private assertSellerAccess(sellerId: string | null, actor: AuthenticatedUser) {
    if (actor.role === UserRole.SELLER && sellerId !== actor.id) {
      throw new DomainException(
        'CRM_ACCESS_DENIED',
        'Registro não vinculado a este vendedor',
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

  private async assertCustomer(customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId: this.tenantContext.requireTenantId(),
        active: true,
      },
    });

    if (!customer) {
      throw new DomainException('CUSTOMER_NOT_FOUND', 'Cliente não encontrado', 400);
    }
  }

  private async assertVehicle(vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        tenantId: this.tenantContext.requireTenantId(),
      },
    });

    if (!vehicle) {
      throw new DomainException('VEHICLE_NOT_FOUND', 'Veículo não encontrado', 404);
    }
  }

  private async syncLeadFollowUpReminder(
    leadId: string,
    leadName: string,
    sellerId: string | null | undefined,
    nextFollowUpAt: Date | null | undefined,
  ) {
    const tenantId = this.tenantContext.requireTenantId();

    if (!nextFollowUpAt || !sellerId) {
      await this.crmRepository.cancelPendingAutoRemindersForLead(leadId);
      return;
    }

    const existing = await this.crmRepository.findPendingAutoReminderForLead(leadId);

    if (existing) {
      await this.crmRepository.updateAutoReminder(existing.id, {
        userId: sellerId,
        dueAt: nextFollowUpAt,
        title: `Follow-up: ${leadName}`,
      });
      return;
    }

    await this.crmRepository.createAutoReminder({
      tenantId,
      userId: sellerId,
      title: `Follow-up: ${leadName}`,
      dueAt: nextFollowUpAt,
      leadId,
      autoGenerated: true,
    });
  }

  private async syncOpportunityFollowUpReminder(
    opportunityId: string,
    title: string,
    sellerId: string,
    nextFollowUpAt: Date | null | undefined,
  ) {
    const tenantId = this.tenantContext.requireTenantId();

    if (!nextFollowUpAt) {
      await this.crmRepository.cancelPendingAutoRemindersForOpportunity(opportunityId);
      return;
    }

    const existing =
      await this.crmRepository.findPendingAutoReminderForOpportunity(opportunityId);

    if (existing) {
      await this.crmRepository.updateAutoReminder(existing.id, {
        userId: sellerId,
        dueAt: nextFollowUpAt,
        title: `Follow-up: ${title}`,
      });
      return;
    }

    await this.crmRepository.createAutoReminder({
      tenantId,
      userId: sellerId,
      title: `Follow-up: ${title}`,
      dueAt: nextFollowUpAt,
      opportunityId,
      autoGenerated: true,
    });
  }
}
