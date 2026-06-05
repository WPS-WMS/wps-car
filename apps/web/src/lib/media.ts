export function getApiOrigin() {
  const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  return url.replace(/\/api\/v1\/?$/, '');
}

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const origin = getApiOrigin();
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
