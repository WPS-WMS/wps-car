import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { TenantContextService } from '../../../infrastructure/tenant/tenant-context.service';

@Injectable()
export class ConfigCatalogRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private tenantId() {
    return this.tenantContext.requireTenantId();
  }

  // Vehicle types
  findVehicleTypes(activeOnly?: boolean) {
    return this.prisma.configVehicleType.findMany({
      where: { tenantId: this.tenantId(), ...(activeOnly && { active: true }) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findVehicleTypeById(id: string) {
    return this.prisma.configVehicleType.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  createVehicleType(data: {
    name: string;
    code: string;
    sortOrder?: number;
    active?: boolean;
  }) {
    return this.prisma.configVehicleType.create({
      data: { tenantId: this.tenantId(), ...data },
    });
  }

  updateVehicleType(
    id: string,
    data: Partial<{ name: string; code: string; sortOrder: number; active: boolean }>,
  ) {
    return this.prisma.configVehicleType.update({ where: { id }, data });
  }

  // Cost types
  findCostTypes(activeOnly?: boolean) {
    return this.prisma.configCostType.findMany({
      where: { tenantId: this.tenantId(), ...(activeOnly && { active: true }) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findCostTypeById(id: string) {
    return this.prisma.configCostType.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  createCostType(data: {
    name: string;
    code: string;
    sortOrder?: number;
    active?: boolean;
  }) {
    return this.prisma.configCostType.create({
      data: { tenantId: this.tenantId(), ...data },
    });
  }

  updateCostType(
    id: string,
    data: Partial<{ name: string; code: string; sortOrder: number; active: boolean }>,
  ) {
    return this.prisma.configCostType.update({ where: { id }, data });
  }

  // Payment methods
  findPaymentMethods(activeOnly?: boolean) {
    return this.prisma.configPaymentMethod.findMany({
      where: { tenantId: this.tenantId(), ...(activeOnly && { active: true }) },
      orderBy: { sortOrder: 'asc' },
    });
  }

  findPaymentMethodById(id: string) {
    return this.prisma.configPaymentMethod.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  createPaymentMethod(data: {
    name: string;
    code: string;
    sortOrder?: number;
    active?: boolean;
  }) {
    return this.prisma.configPaymentMethod.create({
      data: { tenantId: this.tenantId(), ...data },
    });
  }

  updatePaymentMethod(
    id: string,
    data: Partial<{ name: string; code: string; sortOrder: number; active: boolean }>,
  ) {
    return this.prisma.configPaymentMethod.update({ where: { id }, data });
  }

  // Statuses
  findStatuses(entity?: string, activeOnly?: boolean) {
    return this.prisma.configStatus.findMany({
      where: {
        tenantId: this.tenantId(),
        ...(entity && { entity }),
        ...(activeOnly && { active: true }),
      },
      orderBy: [{ entity: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  findStatusById(id: string) {
    return this.prisma.configStatus.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  createStatus(data: {
    entity: string;
    name: string;
    code: string;
    color?: string;
    sortOrder?: number;
    active?: boolean;
  }) {
    return this.prisma.configStatus.create({
      data: { tenantId: this.tenantId(), ...data },
    });
  }

  updateStatus(
    id: string,
    data: Partial<{
      entity: string;
      name: string;
      code: string;
      color: string;
      sortOrder: number;
      active: boolean;
    }>,
  ) {
    return this.prisma.configStatus.update({ where: { id }, data });
  }

  // Email templates
  findEmailTemplates(activeOnly?: boolean) {
    return this.prisma.configEmailTemplate.findMany({
      where: { tenantId: this.tenantId(), ...(activeOnly && { active: true }) },
      orderBy: { code: 'asc' },
    });
  }

  findEmailTemplateById(id: string) {
    return this.prisma.configEmailTemplate.findFirst({
      where: { id, tenantId: this.tenantId() },
    });
  }

  findEmailTemplateByCode(code: string) {
    return this.prisma.configEmailTemplate.findFirst({
      where: { code, tenantId: this.tenantId() },
    });
  }

  createEmailTemplate(data: {
    code: string;
    subject: string;
    bodyHtml: string;
    active?: boolean;
  }) {
    return this.prisma.configEmailTemplate.create({
      data: { tenantId: this.tenantId(), ...data },
    });
  }

  updateEmailTemplate(
    id: string,
    data: Partial<{ code: string; subject: string; bodyHtml: string; active: boolean }>,
  ) {
    return this.prisma.configEmailTemplate.update({ where: { id }, data });
  }
}
