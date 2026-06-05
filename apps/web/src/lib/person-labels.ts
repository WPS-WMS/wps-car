export const personTypeLabels: Record<string, string> = {
  INDIVIDUAL: 'Pessoa física',
  COMPANY: 'Pessoa jurídica',
};

export const customerTypeLabels: Record<string, string> = {
  BUYER: 'Comprador',
  SELLER: 'Vendedor (cliente)',
  BOTH: 'Comprador e vendedor',
};

export const supplierCategoryLabels: Record<string, string> = {
  INDIVIDUAL: 'Pessoa física',
  COMPANY: 'Pessoa jurídica',
  AUCTION: 'Leilão',
  DEALERSHIP: 'Outra revenda',
  INSURANCE: 'Seguradora',
  BANK: 'Banco',
  PRIVATE: 'Particular',
};

export const historyActionLabels: Record<string, string> = {
  CREATED: 'Cadastro criado',
  UPDATED: 'Cadastro atualizado',
  SALE: 'Venda registrada',
  NOTE: 'Observação',
  PURCHASE: 'Compra de veículo',
};

export function formatAddress(parts: {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}): string {
  const line1 = [parts.street, parts.number].filter(Boolean).join(', ');
  const line2 = [parts.neighborhood, parts.city, parts.state].filter(Boolean).join(' — ');
  const zip = parts.zipCode ? `CEP ${parts.zipCode}` : '';
  const chunks = [line1, parts.complement, line2, zip].filter(Boolean);
  return chunks.length ? chunks.join(' · ') : '—';
}
