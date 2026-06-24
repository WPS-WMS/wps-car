const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  return null;
}

export function assertBufferMatchesMime(buffer: Buffer, declaredMime: string): void {
  if (!ALLOWED_MIMES.has(declaredMime)) {
    throw new Error('Tipo de arquivo não permitido');
  }

  const detected = detectMimeFromBuffer(buffer);
  if (!detected) {
    throw new Error('Conteúdo do arquivo não reconhecido');
  }

  if (detected !== declaredMime) {
    throw new Error('Conteúdo do arquivo não corresponde ao tipo informado');
  }
}
