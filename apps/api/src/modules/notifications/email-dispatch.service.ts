import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { MailService } from '../../infrastructure/mail/mail.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  getEmailNotificationType,
  isEmailNotificationType,
} from '../settings/constants/email-notification-types';
import {
  EmailNotificationRole,
  normalizeEmailNotificationRecipients,
  EMAIL_NOTIFICATION_RECIPIENTS_KEY,
} from '../settings/constants/email-notification-recipients';
import { TENANT_SETTING_KEYS } from '../settings/constants/tenant-setting-keys';
import { renderEmailTemplate } from './email-template.util';

export interface SendTypedEmailOptions {
  tenantId?: string | null;
  code: string;
  to: string;
  variables?: Record<string, string | number | null | undefined>;
  /** Recuperação de senha envia mesmo com tipo inativo */
  force?: boolean;
}

@Injectable()
export class EmailDispatchService {
  private readonly logger = new Logger(EmailDispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async sendTypedEmail(options: SendTypedEmailOptions): Promise<boolean> {
    const { tenantId, code, to, variables = {}, force = false } = options;

    if (!isEmailNotificationType(code)) {
      this.logger.warn(`Tipo de e-mail inválido: ${code}`);
      return false;
    }

    const definition = getEmailNotificationType(code)!;
    const template = tenantId
      ? await this.prisma.configEmailTemplate.findFirst({
          where: { tenantId, code },
        })
      : null;

    if (template && !template.active && !force) {
      this.logger.debug(`E-mail ${code} inativo para tenant ${tenantId ?? 'plataforma'}`);
      return false;
    }

    const subject = renderEmailTemplate(
      template?.subject ?? definition.defaultSubject,
      variables,
    );
    const html = renderEmailTemplate(
      template?.bodyHtml ?? definition.defaultBodyHtml,
      variables,
    );

    const from = await this.resolveFromAddress(tenantId);
    return this.mailService.send({ to, subject, html, from });
  }

  async sendToRoleRecipients(options: {
    tenantId: string;
    code: string;
    roles: EmailNotificationRole[];
    variables?: Record<string, string | number | null | undefined>;
    excludeEmails?: string[];
    force?: boolean;
  }): Promise<number> {
    const { tenantId, code, roles, variables = {}, excludeEmails = [], force = false } = options;

    if (!roles.length || !tenantId) return 0;

    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        active: true,
        role: { in: roles as UserRole[] },
      },
      select: { email: true },
    });

    const exclude = new Set(excludeEmails.map((email) => email.trim().toLowerCase()));
    let sent = 0;

    for (const user of users) {
      const email = user.email.trim();
      if (!email || exclude.has(email.toLowerCase())) continue;

      const ok = await this.sendTypedEmail({
        tenantId,
        code,
        to: email,
        variables,
        force,
      });

      if (ok) sent += 1;
    }

    return sent;
  }

  async getConfiguredRoleRecipients(tenantId: string, code: string): Promise<EmailNotificationRole[]> {
    const row = await this.prisma.tenantSetting.findUnique({
      where: {
        tenantId_key: { tenantId, key: EMAIL_NOTIFICATION_RECIPIENTS_KEY },
      },
    });

    const map = normalizeEmailNotificationRecipients(row?.value);
    return map[code] ?? [];
  }

  private async resolveFromAddress(tenantId?: string | null) {
    const defaultFrom = this.config.get<string>('mail.from') ?? 'noreply@wpscar.com.br';

    if (!tenantId) {
      return defaultFrom;
    }

    const row = await this.prisma.tenantSetting.findUnique({
      where: {
        tenantId_key: {
          tenantId,
          key: TENANT_SETTING_KEYS.NOTIFICATION_EMAIL,
        },
      },
    });

    if (typeof row?.value === 'string' && row.value.trim()) {
      return row.value.trim();
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { email: true, name: true },
    });

    if (tenant?.email?.trim()) {
      return `"${tenant.name}" <${tenant.email.trim()}>`;
    }

    return defaultFrom;
  }
}
