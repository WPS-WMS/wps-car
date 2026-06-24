'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  fetchAuthenticatedBlobUrl,
  releaseAuthenticatedBlobUrl,
} from '@/lib/authenticated-media-cache';
import { cn } from '@/lib/utils';

type AuthenticatedImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src'
> & {
  path: string | null | undefined;
  fallback?: React.ReactNode;
  showLoading?: boolean;
};

export function AuthenticatedImage({
  path,
  fallback = null,
  showLoading = false,
  className,
  alt = '',
  ...props
}: AuthenticatedImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setSrc(null);
      setFailed(false);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setFailed(false);

    fetchAuthenticatedBlobUrl(path)
      .then((objectUrl) => {
        if (!active) {
          if (objectUrl) releaseAuthenticatedBlobUrl(path);
          return;
        }
        if (!objectUrl) {
          setSrc(null);
          setFailed(true);
          return;
        }
        setSrc(objectUrl);
      })
      .catch(() => {
        if (active) {
          setSrc(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      releaseAuthenticatedBlobUrl(path);
      setSrc(null);
    };
  }, [path]);

  if (loading && showLoading) {
    return (
      <div
        className={cn('flex items-center justify-center', className)}
        aria-busy="true"
        aria-label="Carregando imagem"
      >
        <Loader2 className="h-6 w-6 animate-spin text-white/70" />
      </div>
    );
  }

  if (!src) {
    if (failed) {
      return (
        <div
          className={cn(
            'flex items-center justify-center text-[10px] text-muted-foreground',
            showLoading && 'text-xs text-white/60',
            className,
          )}
        >
          {showLoading ? 'Não foi possível carregar a imagem' : '—'}
        </div>
      );
    }
    return <>{fallback}</>;
  }

  return <img {...props} alt={alt} src={src} className={cn(className)} />;
}
