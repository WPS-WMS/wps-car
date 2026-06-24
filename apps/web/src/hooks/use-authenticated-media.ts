'use client';

import { useCallback } from 'react';
import { getAccessToken } from '@/lib/auth-storage';
import { mediaUrl } from '@/lib/media';

export function useAuthenticatedMediaDownload() {
  return useCallback(async (path: string | null | undefined, fileName?: string) => {
    const absoluteUrl = mediaUrl(path);
    const token = getAccessToken();
    if (!absoluteUrl || !token) return;

    const response = await fetch(absoluteUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName ?? 'download';
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }, []);
}
