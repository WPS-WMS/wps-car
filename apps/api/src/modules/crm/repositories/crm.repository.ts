import { Injectable } from '@nestjs/common';
import {
  LeadStatus,
  OpportunityStatus,
  Prisma,
  ReminderStatus,
} from '@prisma/client';
import { TenantScopedRepository } from '../../../application/repositories/tenant-scoped.repository';
import { resolvePagination } from '../../../common/utils/pagination.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';
import { ListLeadsQueryDto } from '../dto/list-leads-query.dto';
import { ListOpportunitiesQueryDto } from '../dto/list-opportunities-query.dto';
import { ListRemindersQueryDto } from '../dto/list-reminders-query.dto';

const sellerSelect = { id: true, name: true, email: true } satisfies Prisma.UserSelect;

const customerSelect = {
  id: true,
  name: true,
  document: true,
  phone: true,
} satisfies Prisma.CustomerSelect;

const vehicleSelect = {
  id: true,
  brand: true,
  model: true,
  licensePlate: true,
  status: true,
} satisfies Prisma.VehicleSelect;

const leadInclude = {
  seller: { select: sellerSelect },
  customer: { select: customerSelect },
} satisfies Prisma.LeadInclude;

const leadDetailInclude = {
  ...leadInclude,
  contacts: {
    orderBy: { contactedAt: 'desc' },
    include: { user: { select: sellerSelect } },
  },
  interests: {
    orderBy: { createdAt: 'desc' },
    include: { vehicle: { select: vehicleSelect } },
  },
} satisfies Prisma.LeadInclude;

const opportunityInclude = {
  seller: { select: sellerSelect },
  customer: { select: customerSelect },
  vehicle: { select: vehicleSelect },
} satisfies Prisma.OpportunityInclude;

@Injectable()
export class CrmRepository extends TenantScopedRepository {
  constructor(
    tenantContext: TenantContextService,
    private readonly prisma: PrismaService,
  ) {
    super(tenantContext);
  }

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  buildLeadWhere(
    query: ListLeadsQueryDto,
    options?: { sellerId?: string },
  ): Prisma.LeadWhereInput {
    return {
      tenantId: this.tenantId(),
      ...(options?.sellerId && { sellerId: options.sellerId }),
      ...(query.sellerId && { sellerId: query.sellerId }),
      ...(query.status && { status: query.status }),
      ...(query.source && { source: query.source }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
        ],
      }),
    };
  }

  async findLeadsPaginated(
    query: ListLeadsQueryDto,
    options?: { sellerId?: string },
  ) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where = this.buildLeadWhere(query, options);

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: leadInclude,
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findLeadById(id: string) {
    return this.prisma.lead.findFirst({
      where: { id, tenantId: this.tenantId() },
      include: leadDetailInclude,
    });
  }

  async createLead(data: Prisma.LeadUncheckedCreateInput) {
    return this.prisma.lead.create({
      data,
      include: leadInclude,
    });
  }

  async updateLead(id: string, data: Prisma.LeadUncheckedUpdateInput) {
    return this.prisma.lead.update({
      where: { id },
      data,
      include: leadInclude,
    });
  }

  async createLeadContact(data: Prisma.LeadContactUncheckedCreateInput) {
    return this.prisma.leadContact.create({
      data,
      include: { user: { select: sellerSelect } },
    });
  }

  async createLeadInterest(data: Prisma.LeadVehicleInterestUncheckedCreateInput) {
    return this.prisma.leadVehicleInterest.create({
      data,
      include: { vehicle: { select: vehicleSelect } },
    });
  }

  async findLeadInterest(leadId: string, vehicleId: string) {
    return this.prisma.leadVehicleInterest.findFirst({
      where: { leadId, vehicleId, tenantId: this.tenantId() },
    });
  }

  buildOpportunityWhere(
    query: ListOpportunitiesQueryDto,
    options?: { sellerId?: string },
  ): Prisma.OpportunityWhereInput {
    return {
      tenantId: this.tenantId(),
      ...(options?.sellerId && { sellerId: options.sellerId }),
      ...(query.sellerId && { sellerId: query.sellerId }),
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { notes: { contains: query.search, mode: 'insensitive' } },
          { customer: { name: { contains: query.search, mode: 'insensitive' } } },
        ],
      }),
    };
  }

  async findOpportunitiesPaginated(
    query: ListOpportunitiesQueryDto,
    options?: { sellerId?: string },
  ) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where = this.buildOpportunityWhere(query, options);

    const [data, total] = await Promise.all([
      this.prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: opportunityInclude,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOpportunityById(id: string) {
    return this.prisma.opportunity.findFirst({
      where: { id, tenantId: this.tenantId() },
      include: opportunityInclude,
    });
  }

  async createOpportunity(data: Prisma.OpportunityUncheckedCreateInput) {
    return this.prisma.opportunity.create({
      data,
      include: opportunityInclude,
    });
  }

  async updateOpportunity(id: string, data: Prisma.OpportunityUncheckedUpdateInput) {
    return this.prisma.opportunity.update({
      where: { id },
      data,
      include: opportunityInclude,
    });
  }

  async countLeadsByStatus(sellerId?: string) {
    const where: Prisma.LeadWhereInput = {
      tenantId: this.tenantId(),
      ...(sellerId && { sellerId }),
    };

    const groups = await this.prisma.lead.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    const counts = Object.fromEntries(
      Object.values(LeadStatus).map((status) => [status, 0]),
    ) as Record<LeadStatus, number>;

    for (const group of groups) {
      counts[group.status] = group._count._all;
    }

    return counts;
  }

  async countOpportunitiesByStatus(sellerId?: string) {
    const where: Prisma.OpportunityWhereInput = {
      tenantId: this.tenantId(),
      ...(sellerId && { sellerId }),
    };

    const groups = await this.prisma.opportunity.groupBy({
      by: ['status'],
      where,
      _count: { _all: true },
    });

    const counts = Object.fromEntries(
      Object.values(OpportunityStatus).map((status) => [status, 0]),
    ) as Record<OpportunityStatus, number>;

    for (const group of groups) {
      counts[group.status] = group._count._all;
    }

    return counts;
  }

  buildReminderWhere(
    query: ListRemindersQueryDto,
    options?: { userId?: string },
  ): Prisma.SellerReminderWhereInput {
    return {
      tenantId: this.tenantId(),
      ...(options?.userId && { userId: options.userId }),
      ...(query.status && { status: query.status }),
    };
  }

  async findRemindersPaginated(
    query: ListRemindersQueryDto,
    options?: { userId?: string },
  ) {
    const { page, limit, skip, orderBy } = resolvePagination(query);
    const where = this.buildReminderWhere(query, options);

    const [data, total] = await Promise.all([
      this.prisma.sellerReminder.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy ?? { dueAt: 'asc' },
      }),
      this.prisma.sellerReminder.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findReminderById(id: string) {
    return this.prisma.sellerReminder.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  async completeReminder(id: string) {
    return this.prisma.sellerReminder.update({
      where: { id },
      data: {
        status: ReminderStatus.DONE,
        completedAt: new Date(),
      },
    });
  }

  async findPendingAutoReminderForLead(leadId: string) {
    return this.prisma.sellerReminder.findFirst({
      where: {
        tenantId: this.tenantId(),
        leadId,
        autoGenerated: true,
        status: ReminderStatus.PENDING,
      },
    });
  }

  async findPendingAutoReminderForOpportunity(opportunityId: string) {
    return this.prisma.sellerReminder.findFirst({
      where: {
        tenantId: this.tenantId(),
        opportunityId,
        autoGenerated: true,
        status: ReminderStatus.PENDING,
      },
    });
  }

  async createAutoReminder(data: Prisma.SellerReminderUncheckedCreateInput) {
    return this.prisma.sellerReminder.create({ data });
  }

  async updateAutoReminder(
    id: string,
    data: Prisma.SellerReminderUncheckedUpdateInput,
  ) {
    return this.prisma.sellerReminder.update({ where: { id }, data });
  }

  async cancelPendingAutoRemindersForLead(leadId: string) {
    return this.prisma.sellerReminder.updateMany({
      where: {
        tenantId: this.tenantId(),
        leadId,
        autoGenerated: true,
        status: ReminderStatus.PENDING,
      },
      data: { status: ReminderStatus.CANCELLED },
    });
  }

  async cancelPendingAutoRemindersForOpportunity(opportunityId: string) {
    return this.prisma.sellerReminder.updateMany({
      where: {
        tenantId: this.tenantId(),
        opportunityId,
        autoGenerated: true,
        status: ReminderStatus.PENDING,
      },
      data: { status: ReminderStatus.CANCELLED },
    });
  }
}
