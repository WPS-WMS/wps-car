import { UserRole } from '@prisma/client';
import { EMAIL_NOTIFICATION_TYPE_CODES } from './email-notification-types';

export const EMAIL_NOTIFICATION_RECIPIENTS_KEY = 'email_notification_recipients';

export type EmailNotificationRole = Extract<UserRole, 'ADMIN' | 'MANAGER' | 'SELLER'>;

export const EMAIL_NOTIFICATION_ROLES: EmailNotificationRole[] = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.SELLER,
];

export const EMAIL_NOTIFICATION_ROLE_LABELS: Record<EmailNotificationRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  SELLER: 'Vendedor',
};

export const EMAIL_NOTIFICATION_ROLE_SHORT_LABELS: Record<EmailNotificationRole, string> = {
  ADMIN: 'Admin.',
  MANAGER: 'Ger.',
  SELLER: 'Vend.',
};

/** Tipos que aceitam destinatários internos por perfil na matriz */
export const EMAIL_TYPES_WITH_ROLE_RECIPIENTS = new Set([
  'sale_completed',
  'sale_registered',
  'vehicle_reserved',
]);

export const DEFAULT_EMAIL_NOTIFICATION_RECIPIENTS: Record<string, EmailNotificationRole[]> = {
  sale_completed: [],
  sale_registered: [UserRole.ADMIN, UserRole.MANAGER],
  vehicle_reserved: [],
  user_welcome: [],
  password_reset: [],
};

export function normalizeEmailNotificationRecipients(
  stored: unknown,
): Record<string, EmailNotificationRole[]> {
  const result: Record<string, EmailNotificationRole[]> = {};

  for (const code of EMAIL_NOTIFICATION_TYPE_CODES) {
    result[code] = [...(DEFAULT_EMAIL_NOTIFICATION_RECIPIENTS[code] ?? [])];
  }

  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) {
    return result;
  }

  for (const [code, roles] of Object.entries(stored as Record<string, unknown>)) {
    if (!EMAIL_NOTIFICATION_TYPE_CODES.includes(code) || !Array.isArray(roles)) continue;
    result[code] = roles.filter(
      (role): role is EmailNotificationRole =>
        typeof role === 'string' &&
        EMAIL_NOTIFICATION_ROLES.includes(role as EmailNotificationRole),
    );
  }

  return result;
}

export function supportsRoleRecipients(code: string) {
  return EMAIL_TYPES_WITH_ROLE_RECIPIENTS.has(code);
}
