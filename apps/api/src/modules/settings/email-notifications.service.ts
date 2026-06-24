import { Injectable } from '@nestjs/common';
import { DomainException } from '../../domain/exceptions/domain.exception';
import { TENANT_SETTING_KEYS } from './constants/tenant-setting-keys';
import {
  DEFAULT_EMAIL_NOTIFICATION_RECIPIENTS,
  EMAIL_NOTIFICATION_RECIPIENTS_KEY,
  EMAIL_NOTIFICATION_ROLE_LABELS,
  EMAIL_NOTIFICATION_ROLES,
  normalizeEmailNotificationRecipients,
  supportsRoleRecipients,
} from './constants/email-notification-recipients';
import {
  EMAIL_NOTIFICATION_TYPES,
  getEmailNotificationType,
  isEmailNotificationType,
} from './constants/email-notification-types';
import { UpsertEmailNotificationDto } from './dto/upsert-email-notification.dto';
import { UpdateEmailNotificationRecipientsDto } from './dto/update-email-notification-recipients.dto';
import { ConfigCatalogRepository } from './repositories/config-catalog.repository';
import { TenantSettingsRepository } from './repositories/tenant-settings.repository';

@Injectable()
export class EmailNotificationsService {
  constructor(
    private readonly catalogRepository: ConfigCatalogRepository,
    private readonly tenantSettingsRepository: TenantSettingsRepository,
  ) {}

  async getConfiguration() {
    const [templates, settingsRows] = await Promise.all([
      this.catalogRepository.findEmailTemplates(false),
      this.tenantSettingsRepository.findAll(),
    ]);

    const templateByCode = new Map(templates.map((template) => [template.code, template]));
    const notificationEmailRow = settingsRows.find(
      (row) => row.key === TENANT_SETTING_KEYS.NOTIFICATION_EMAIL,
    );
    const senderEmail =
      typeof notificationEmailRow?.value === 'string' ? notificationEmailRow.value : '';

    const storedRecipients = settingsRows.find(
      (row) => row.key === EMAIL_NOTIFICATION_RECIPIENTS_KEY,
    )?.value;
    const recipientMap = normalizeEmailNotificationRecipients(storedRecipients);

    return {
      senderEmail,
      roles: EMAIL_NOTIFICATION_ROLES.map((role) => ({
        role,
        label: EMAIL_NOTIFICATION_ROLE_LABELS[role],
      })),
      defaultRecipients: DEFAULT_EMAIL_NOTIFICATION_RECIPIENTS,
      types: EMAIL_NOTIFICATION_TYPES.map((definition) => {
        const stored = templateByCode.get(definition.code);
        return {
          code: definition.code,
          label: definition.label,
          description: definition.description,
          recipient: definition.recipient,
          recipientLabel: definition.recipientLabel,
          triggerDescription: definition.triggerDescription,
          supportsRoleRecipients: supportsRoleRecipients(definition.code),
          recipientRoles: recipientMap[definition.code] ?? [],
          variables: definition.variables,
          id: stored?.id ?? null,
          subject: stored?.subject ?? definition.defaultSubject,
          bodyHtml: stored?.bodyHtml ?? definition.defaultBodyHtml,
          active: stored?.active ?? false,
          isConfigured: Boolean(stored),
          defaults: {
            subject: definition.defaultSubject,
            bodyHtml: definition.defaultBodyHtml,
          },
        };
      }),
    };
  }

  async updateRecipients(dto: UpdateEmailNotificationRecipientsDto) {
    const normalized = normalizeEmailNotificationRecipients({});

    for (const rule of dto.rules) {
      if (!isEmailNotificationType(rule.code)) {
        throw new DomainException(
          'INVALID_EMAIL_NOTIFICATION_TYPE',
          'Tipo de e-mail inválido',
          400,
        );
      }

      if (!supportsRoleRecipients(rule.code) && rule.roles.length > 0) {
        throw new DomainException(
          'ROLE_RECIPIENTS_NOT_SUPPORTED',
          `O tipo ${rule.code} não aceita destinatários por perfil`,
          400,
        );
      }

      normalized[rule.code] = rule.roles;
    }

    await this.tenantSettingsRepository.upsertMany([
      { key: EMAIL_NOTIFICATION_RECIPIENTS_KEY, value: normalized },
    ]);

    return { recipients: normalized };
  }

  async getRecipientRolesForType(code: string) {
    if (!isEmailNotificationType(code)) return [];
    const rows = await this.tenantSettingsRepository.findAll();
    const stored = rows.find((row) => row.key === EMAIL_NOTIFICATION_RECIPIENTS_KEY)?.value;
    const map = normalizeEmailNotificationRecipients(stored);
    return map[code] ?? [];
  }

  async upsertType(code: string, dto: UpsertEmailNotificationDto) {
    if (!isEmailNotificationType(code)) {
      throw new DomainException(
        'INVALID_EMAIL_NOTIFICATION_TYPE',
        'Tipo de e-mail inválido',
        400,
      );
    }

    const definition = getEmailNotificationType(code)!;
    const existing = await this.catalogRepository.findEmailTemplateByCode(code);

    if (existing) {
      return this.catalogRepository.updateEmailTemplate(existing.id, {
        subject: dto.subject,
        bodyHtml: dto.bodyHtml,
        active: dto.active,
      });
    }

    try {
      return await this.catalogRepository.createEmailTemplate({
        code: definition.code,
        subject: dto.subject,
        bodyHtml: dto.bodyHtml,
        active: dto.active,
      });
    } catch {
      throw new DomainException('CODE_ALREADY_EXISTS', 'Tipo de e-mail já cadastrado', 409);
    }
  }

  async ensureDefaultTemplates() {
    for (const definition of EMAIL_NOTIFICATION_TYPES) {
      const existing = await this.catalogRepository.findEmailTemplateByCode(definition.code);
      if (existing) continue;

      await this.catalogRepository.createEmailTemplate({
        code: definition.code,
        subject: definition.defaultSubject,
        bodyHtml: definition.defaultBodyHtml,
        active: definition.code === 'sale_completed',
      });
    }
  }
}
