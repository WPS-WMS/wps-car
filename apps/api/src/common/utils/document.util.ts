export function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, '');
}

export function normalizeDocument(document: string): string {
  return document.replace(/\D/g, '');
}

export function isValidCnpjLength(cnpj: string): boolean {
  return normalizeCnpj(cnpj).length === 14;
}

export function isValidCpfLength(cpf: string): boolean {
  return normalizeDocument(cpf).length === 11;
}

export function isValidDocument(document: string): boolean {
  const normalized = normalizeDocument(document);
  return normalized.length === 11 || normalized.length === 14;
}

export function inferPersonType(document: string): 'INDIVIDUAL' | 'COMPANY' {
  return normalizeDocument(document).length === 14 ? 'COMPANY' : 'INDIVIDUAL';
}
