'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { AuthenticatedImage } from '@/components/media/authenticated-image';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { VehiclePhoto } from '@/types/api';

export type VehiclePhotoViewItem = Pick<
  VehiclePhoto,
  'id' | 'url' | 'fileName' | 'isPrimary'
>;

const THUMB_SIZES = {
  xs: 'h-10 w-10',
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
} as const;

type VehiclePhotoLightboxProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: VehiclePhotoViewItem[];
  index: number;
  onIndexChange: (index: number) => void;
  isLoading?: boolean;
};

export function VehiclePhotoLightbox({
  open,
  onOpenChange,
  photos,
  index,
  onIndexChange,
  isLoading = false,
}: VehiclePhotoLightboxProps) {
  const photo = photos[index];
  const hasMultiple = photos.length > 1;

  const goPrev = useCallback(() => {
    if (photos.length <= 1) return;
    onIndexChange((index - 1 + photos.length) % photos.length);
  }, [index, onIndexChange, photos.length]);

  const goNext = useCallback(() => {
    if (photos.length <= 1) return;
    onIndexChange((index + 1) % photos.length);
  }, [index, onIndexChange, photos.length]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, goPrev, goNext]);

  useEffect(() => {
    if (index >= photos.length && photos.length > 0) {
      onIndexChange(photos.length - 1);
    }
  }, [index, onIndexChange, photos.length]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!flex w-[min(96vw,72rem)] max-w-[min(96vw,72rem)] flex-col gap-2 border-0 bg-brand-950/95 p-3 text-white shadow-none sm:p-4 [&>button]:text-white/80 [&>button]:hover:bg-white/10 [&>button]:hover:text-white"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Visualização de imagens do veículo</DialogTitle>

        <div className="relative w-full px-10 sm:px-12">
          <div
            className="relative w-full"
            style={{ height: 'min(78vh, calc(100vh - 9rem))' }}
          >
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-white/70" aria-hidden />
              </div>
            ) : photo ? (
              <>
                {hasMultiple ? (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Imagem anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Próxima imagem"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center">
                  <AuthenticatedImage
                    key={photo.id}
                    path={photo.url}
                    alt={photo.fileName}
                    showLoading
                    className="max-h-full max-w-full object-contain"
                    style={{
                      width: 'auto',
                      height: 'auto',
                      maxHeight: '100%',
                      maxWidth: '100%',
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-white/70">Nenhuma imagem disponível.</p>
              </div>
            )}
          </div>
        </div>

        {photo && !isLoading ? (
          <div className="mt-2 flex items-center justify-between gap-3 text-sm text-white/80">
            <span className="truncate">{photo.fileName}</span>
            {hasMultiple ? (
              <span className="shrink-0 tabular-nums">
                {index + 1} / {photos.length}
              </span>
            ) : null}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type VehiclePhotoThumbProps = {
  path: string | null | undefined;
  alt?: string;
  size?: keyof typeof THUMB_SIZES;
  isPrimary?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

export function VehiclePhotoThumb({
  path,
  alt = '',
  size = 'md',
  isPrimary,
  onClick,
  className,
  disabled,
}: VehiclePhotoThumbProps) {
  const clickable = Boolean(onClick && path && !disabled);

  const image = (
    <AuthenticatedImage
      path={path}
      alt={alt}
      className="h-full w-full object-cover"
      fallback={
        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
          —
        </div>
      }
    />
  );

  const frameClass = cn(
    'relative shrink-0 overflow-hidden rounded-md bg-muted',
    THUMB_SIZES[size],
    isPrimary && 'ring-2 ring-brand-500 ring-offset-1',
    className,
  );

  if (!clickable) {
    return (
      <div className={frameClass} aria-hidden={!path}>
        {image}
        {isPrimary ? (
          <span className="absolute left-1 top-1 rounded bg-brand-600 px-1 py-px text-[9px] font-medium text-white">
            1ª
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
      className={cn(
        frameClass,
        'cursor-zoom-in transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2',
      )}
      aria-label="Ampliar imagem"
    >
      {image}
      {isPrimary ? (
        <span className="absolute left-1 top-1 rounded bg-brand-600 px-1 py-px text-[9px] font-medium text-white">
          1ª
        </span>
      ) : null}
    </button>
  );
}

type UseVehiclePhotoViewerOptions = {
  photos?: VehiclePhotoViewItem[];
  vehicleId?: string;
  fallbackPhoto?: VehiclePhotoViewItem | null;
};

export function useVehiclePhotoViewer(options: UseVehiclePhotoViewerOptions = {}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const shouldFetch = open && Boolean(options.vehicleId) && !options.photos?.length;

  const photosQuery = useQuery({
    queryKey: ['vehicles', options.vehicleId, 'photos'],
    queryFn: () => api.getVehiclePhotos(options.vehicleId!),
    enabled: shouldFetch,
    staleTime: 60_000,
  });

  const photos = useMemo(() => {
    if (options.photos?.length) return options.photos;
    if (photosQuery.data?.length) return photosQuery.data;
    if (options.fallbackPhoto) return [options.fallbackPhoto];
    return [];
  }, [options.fallbackPhoto, options.photos, photosQuery.data]);

  const openAt = useCallback(
    (startIndex = 0) => {
      const safeIndex = photos.length > 0 ? Math.min(startIndex, photos.length - 1) : 0;
      setIndex(safeIndex);
      setOpen(true);
    },
    [photos.length],
  );

  return {
    open,
    setOpen,
    index,
    setIndex,
    photos,
    openAt,
    isLoading: shouldFetch && photosQuery.isLoading,
    lightbox: (
      <VehiclePhotoLightbox
        open={open}
        onOpenChange={setOpen}
        photos={photos}
        index={index}
        onIndexChange={setIndex}
        isLoading={shouldFetch && photosQuery.isLoading}
      />
    ),
  };
}
