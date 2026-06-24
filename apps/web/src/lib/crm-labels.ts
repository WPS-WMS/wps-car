import type {
  ContactChannel,
  LeadSource,
  LeadStatus,
  VehicleDocumentType,
} from '@/types/api';

export const leadStatusLabels: Record<LeadStatus, string> = {
  NEW: 'Novo',
  CONTACTED: 'Contatado',
  QUALIFIED: 'Qualificado',
  NEGOTIATION: 'Negociação',
  WON: 'Ganho',
  LOST: 'Perdido',
};

export const leadSourceLabels: Record<LeadSource, string> = {
  WHATSAPP: 'WhatsApp',
  PHONE: 'Telefone',
  STORE: 'Loja',
  WEBSITE: 'Site',
  REFERRAL: 'Indicação',
  OTHER: 'Outro',
};

export const contactChannelLabels: Record<ContactChannel, string> = {
  PHONE: 'Telefone',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'E-mail',
  VISIT: 'Visita',
  OTHER: 'Outro',
};

export const opportunityStatusLabels: Record<string, string> = {
  OPEN: 'Aberta',
  IN_PROGRESS: 'Em andamento',
  WON: 'Ganha',
  LOST: 'Perdida',
  CANCELLED: 'Cancelada',
};

export const vehicleDocumentTypeLabels: Record<VehicleDocumentType, string> = {
  CRLV: 'CRLV',
  INVOICE: 'Nota fiscal',
  PURCHASE_CONTRACT: 'Contrato de compra',
  SALE_CONTRACT: 'Contrato de venda',
  CAUTELAR_REPORT: 'Laudo cautelar',
  OTHER: 'Outro documento',
};

export function buildWhatsAppLink(phone: string | null | undefined) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}
