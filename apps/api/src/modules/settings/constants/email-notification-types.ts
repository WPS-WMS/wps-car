export type EmailNotificationRecipient =
  | 'customer'
  | 'tenant_notification'
  | 'user'
  | 'seller';

export interface EmailNotificationVariable {
  name: string;
  description: string;
}

export interface EmailNotificationTypeDefinition {
  code: string;
  label: string;
  description: string;
  recipient: EmailNotificationRecipient;
  recipientLabel: string;
  triggerDescription: string;
  defaultSubject: string;
  defaultBodyHtml: string;
  variables: EmailNotificationVariable[];
}

export const EMAIL_NOTIFICATION_TYPES: EmailNotificationTypeDefinition[] = [
  {
    code: 'sale_completed',
    label: 'Venda concluída',
    description: 'Confirmação enviada ao cliente quando a venda é finalizada.',
    recipient: 'customer',
    recipientLabel: 'Cliente da venda',
    triggerDescription: 'Quando a venda passa para status Vendido ou Finalizado.',
    defaultSubject: 'Parabéns pela sua compra!',
    defaultBodyHtml:
      '<p>Olá {{customerName}},</p><p>Sua compra do veículo <strong>{{vehicleName}}</strong> foi concluída com sucesso.</p><p>Equipe {{companyName}}</p>',
    variables: [
      { name: 'customerName', description: 'Nome do cliente' },
      { name: 'vehicleName', description: 'Marca e modelo do veículo' },
      { name: 'saleAmount', description: 'Valor da venda formatado' },
      { name: 'companyName', description: 'Nome da revenda' },
    ],
  },
  {
    code: 'sale_registered',
    label: 'Nova venda registrada',
    description: 'Aviso interno para a revenda sobre uma nova venda no sistema.',
    recipient: 'tenant_notification',
    recipientLabel: 'E-mail de notificações da revenda',
    triggerDescription: 'Quando uma nova venda é registrada no sistema.',
    defaultSubject: 'Nova venda registrada — {{vehicleName}}',
    defaultBodyHtml:
      '<p>Uma nova venda foi registrada.</p><ul><li>Veículo: {{vehicleName}}</li><li>Cliente: {{customerName}}</li><li>Vendedor: {{sellerName}}</li><li>Valor: {{saleAmount}}</li></ul>',
    variables: [
      { name: 'vehicleName', description: 'Marca e modelo do veículo' },
      { name: 'customerName', description: 'Nome do cliente' },
      { name: 'sellerName', description: 'Nome do vendedor' },
      { name: 'saleAmount', description: 'Valor da venda formatado' },
      { name: 'companyName', description: 'Nome da revenda' },
    ],
  },
  {
    code: 'vehicle_reserved',
    label: 'Veículo reservado',
    description: 'Confirmação enviada ao cliente quando um veículo é reservado.',
    recipient: 'customer',
    recipientLabel: 'Cliente da reserva',
    triggerDescription: 'Quando um veículo entra em status Reservado vinculado ao cliente.',
    defaultSubject: 'Reserva confirmada — {{vehicleName}}',
    defaultBodyHtml:
      '<p>Olá {{customerName}},</p><p>O veículo <strong>{{vehicleName}}</strong> foi reservado para você.</p><p>Entraremos em contato em breve.</p><p>Equipe {{companyName}}</p>',
    variables: [
      { name: 'customerName', description: 'Nome do cliente' },
      { name: 'vehicleName', description: 'Marca e modelo do veículo' },
      { name: 'companyName', description: 'Nome da revenda' },
    ],
  },
  {
    code: 'user_welcome',
    label: 'Boas-vindas ao usuário',
    description: 'E-mail enviado quando um novo usuário é cadastrado na revenda.',
    recipient: 'user',
    recipientLabel: 'Novo usuário',
    triggerDescription: 'Quando um administrador cria um usuário ativo.',
    defaultSubject: 'Bem-vindo ao WPS Car — {{companyName}}',
    defaultBodyHtml:
      '<p>Olá {{userName}},</p><p>Sua conta foi criada no WPS Car da revenda <strong>{{companyName}}</strong>.</p><p>Acesse o sistema com o e-mail {{userEmail}}.</p>',
    variables: [
      { name: 'userName', description: 'Nome do usuário' },
      { name: 'userEmail', description: 'E-mail de acesso' },
      { name: 'companyName', description: 'Nome da revenda' },
    ],
  },
  {
    code: 'password_reset',
    label: 'Recuperação de senha',
    description: 'Link seguro para o usuário redefinir a senha de acesso.',
    recipient: 'user',
    recipientLabel: 'Usuário que solicitou a recuperação',
    triggerDescription: 'Quando o usuário solicita "Esqueci minha senha" na tela de login.',
    defaultSubject: 'Redefinição de senha — {{companyName}}',
    defaultBodyHtml:
      '<p>Olá {{userName}},</p><p>Recebemos um pedido para redefinir sua senha no WPS Car.</p><p><a href="{{resetLink}}">Clique aqui para criar uma nova senha</a></p><p>Este link expira em {{resetExpiresMinutes}} minutos.</p><p>Se você não solicitou, ignore este e-mail.</p>',
    variables: [
      { name: 'userName', description: 'Nome do usuário' },
      { name: 'userEmail', description: 'E-mail de acesso' },
      { name: 'companyName', description: 'Nome da revenda ou WPS Car' },
      { name: 'resetLink', description: 'Link único de redefinição' },
      { name: 'resetExpiresMinutes', description: 'Validade do link em minutos' },
    ],
  },
];

export const EMAIL_NOTIFICATION_TYPE_CODES = EMAIL_NOTIFICATION_TYPES.map((t) => t.code);

export function getEmailNotificationType(code: string) {
  return EMAIL_NOTIFICATION_TYPES.find((type) => type.code === code);
}

export function isEmailNotificationType(code: string) {
  return EMAIL_NOTIFICATION_TYPE_CODES.includes(code);
}

export const EMAIL_NOTIFICATION_RECIPIENT_LABELS: Record<EmailNotificationRecipient, string> = {
  customer: 'Cliente',
  tenant_notification: 'Revenda (e-mail de notificações)',
  user: 'Usuário',
  seller: 'Vendedor',
};
