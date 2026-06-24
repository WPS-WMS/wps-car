export function normalizePhoneDigits(phone: string) {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppLink(phone: string | null | undefined, message?: string) {
  if (!phone) {
    return null;
  }

  const digits = normalizePhoneDigits(phone);
  if (digits.length < 10) {
    return null;
  }

  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  const base = `https://wa.me/${withCountry}`;
  if (!message?.trim()) {
    return base;
  }

  return `${base}?text=${encodeURIComponent(message.trim())}`;
}
