import { getAccessToken } from '@/lib/auth-storage';
import { mediaUrl } from '@/lib/media';

type CacheEntry = {
  objectUrl: string;
  refs: number;
};

const blobCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

export async function fetchAuthenticatedBlobUrl(
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;

  const cached = blobCache.get(path);
  if (cached) {
    cached.refs += 1;
    return cached.objectUrl;
  }

  const pending = inflight.get(path);
  if (pending) {
    const url = await pending;
    if (!url) return null;
    const entry = blobCache.get(path);
    if (entry) entry.refs += 1;
    return url;
  }

  const request = (async () => {
    const absoluteUrl = mediaUrl(path);
    const token = getAccessToken();
    if (!absoluteUrl || !token) return null;

    const response = await fetch(absoluteUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    blobCache.set(path, { objectUrl, refs: 1 });
    return objectUrl;
  })();

  inflight.set(path, request);

  try {
    return await request;
  } finally {
    inflight.delete(path);
  }
}

export function releaseAuthenticatedBlobUrl(path: string | null | undefined) {
  if (!path) return;

  const cached = blobCache.get(path);
  if (!cached) return;

  cached.refs -= 1;
  if (cached.refs <= 0) {
    URL.revokeObjectURL(cached.objectUrl);
    blobCache.delete(path);
  }
}
