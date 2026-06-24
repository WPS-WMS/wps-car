export function getApiOrigin() {
  const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  return url.replace(/\/api\/v1\/?$/, '');
}

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1').replace(
    /\/$/,
    '',
  );
  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (normalized.startsWith('/files/')) {
    return `${apiBase}${normalized}`;
  }

  if (normalized.startsWith('/uploads/')) {
    return `${apiBase}/files${normalized.slice('/uploads'.length)}`;
  }

  return `${apiBase}/files/${normalized.replace(/^\/+/, '')}`;
}
