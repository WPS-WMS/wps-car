import { Injectable, Logger } from '@nestjs/common';
import { SaleStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TENANT_SETTING_KEYS } from '../settings/constants/tenant-setting-keys';
import { EmailDispatchService } from './email-dispatch.service';

@Injectable()
export class SaleNotificationService {
  private readonly logger = new Logger(SaleNotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailDispatch: EmailDispatchService,
  ) {}

  async notifySaleCreated(saleId: string, tenantId: string) {
    try {
      const context = await this.loadSaleContext(saleId, tenantId);
      if (!context) return;

      const roleRecipients = await this.emailDispatch.getConfiguredRoleRecipients(
        tenantId,
        'sale_registered',
      );

      if (roleRecipients.length > 0) {
        await this.emailDispatch.sendToRoleRecipients({
          tenantId,
          code: 'sale_registered',
          roles: roleRecipients,
          variables: context,
        });
      } else {
        const notificationEmail = await this.getNotificationEmail(tenantId);
        if (notificationEmail) {
          await this.emailDispatch.sendTypedEmail({
            tenantId,
            code: 'sale_registered',
            to: notificationEmail,
            variables: context,
          });
        }
      }

      if (context.customerEmail) {
        await this.emailDispatch.sendTypedEmail({
          tenantId,
          code: 'vehicle_reserved',
          to: context.customerEmail,
          variables: context,
        });

        const reservedRoles = await this.emailDispatch.getConfiguredRoleRecipients(
          tenantId,
          'vehicle_reserved',
        );

        if (reservedRoles.length > 0) {
          await this.emailDispatch.sendToRoleRecipients({
            tenantId,
            code: 'vehicle_reserved',
            roles: reservedRoles,
            variables: context,
            excludeEmails: [context.customerEmail],
          });
        }
      }
    } catch (error) {
      this.logger.error(`Falha ao notificar criação da venda ${saleId}`, error);
    }
  }

  async notifySaleFinalized(saleId: string, tenantId: string) {
    try {
      const context = await this.loadSaleContext(saleId, tenantId);
      if (!context) return;

      if (context.customerEmail) {
        await this.emailDispatch.sendTypedEmail({
          tenantId,
          code: 'sale_completed',
          to: context.customerEmail,
          variables: context,
        });
      }

      const completedRoles = await this.emailDispatch.getConfiguredRoleRecipients(
        tenantId,
        'sale_completed',
      );

      if (completedRoles.length > 0) {
        await this.emailDispatch.sendToRoleRecipients({
          tenantId,
          code: 'sale_completed',
          roles: completedRoles,
          variables: context,
          excludeEmails: context.customerEmail ? [context.customerEmail] : [],
        });
      }
    } catch (error) {
      this.logger.error(`Falha ao notificar venda finalizada ${saleId}`, error);
    }
  }

  async notifySaleStatusChange(
    saleId: string,
    tenantId: string,
    previousStatus: SaleStatus,
    nextStatus: SaleStatus,
  ) {
    const finalized: SaleStatus[] = [SaleStatus.SOLD, SaleStatus.COMPLETED];
    if (!finalized.includes(previousStatus) && finalized.includes(nextStatus)) {
      await this.notifySaleFinalized(saleId, tenantId);
    }
  }

  private async loadSaleContext(saleId: string, tenantId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: {
        customer: { select: { name: true, email: true } },
        seller: { select: { name: true } },
        vehicle: { select: { brand: true, model: true } },
        tenant: { select: { name: true } },
      },
    });

    if (!sale) return null;

    const vehicleName = `${sale.vehicle.brand} ${sale.vehicle.model}`.trim();
    const amount = Number(sale.amount.toString());

    return {
      customerName: sale.customer.name,
      customerEmail: sale.customer.email?.trim() || null,
      sellerName: sale.seller.name,
      vehicleName,
      saleAmount: amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      companyName: sale.tenant.name,
    };
  }

  private async getNotificationEmail(tenantId: string) {
    const row = await this.prisma.tenantSetting.findUnique({
      where: {
        tenantId_key: { tenantId, key: TENANT_SETTING_KEYS.NOTIFICATION_EMAIL },
      },
    });

    if (typeof row?.value === 'string' && row.value.trim()) {
      return row.value.trim();
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { email: true },
    });

    return tenant?.email?.trim() || null;
  }
}
