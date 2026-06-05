'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import { mediaUrl } from '@/lib/media';
import {
  isAllowedVehiclePhoto,
  MAX_VEHICLE_PHOTOS,
  VEHICLE_PHOTO_ACCEPT,
} from '@/lib/vehicle-photos';
import type { VehiclePhoto } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function VehiclePhotosSection({
  vehicleId,
  canManage,
}: {
  vehicleId: string;
  canManage: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const photosQuery = useQuery({
    queryKey: ['vehicles', vehicleId, 'photos'],
    queryFn: () => api.getVehiclePhotos(vehicleId),
  });

  const photos = photosQuery.data ?? [];
  const remaining = MAX_VEHICLE_PHOTOS - photos.length;
  const atLimit = remaining <= 0;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId] });
    queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'photos'] });
    queryClient.invalidateQueries({ queryKey: ['vehicles', 'list'] });
    queryClient.invalidateQueries({ queryKey: ['stock'] });
  }

  const setPrimaryMutation = useMutation({
    mutationFn: (photoId: string) => api.setVehiclePhotoPrimary(vehicleId, photoId),
    onSuccess: () => {
      toast.success('Foto principal definida');
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao definir foto principal');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => api.deleteVehiclePhoto(vehicleId, photoId),
    onSuccess: () => {
      toast.success('Foto removida');
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao remover foto');
    },
  });

  async function handleFiles(files: FileList | null) {
    if (!files?.length || !canManage) return;

    setUploading(true);
    let uploaded = 0;
    try {
      let currentCount = photos.length;
      for (const file of Array.from(files)) {
        if (currentCount >= MAX_VEHICLE_PHOTOS) {
          toast.error(`Limite de ${MAX_VEHICLE_PHOTOS} imagens atingido`);
          break;
        }
        if (!isAllowedVehiclePhoto(file)) {
          toast.error(`${file.name}: use JPEG, PNG ou WebP`);
          continue;
        }
        await api.uploadVehiclePhoto(vehicleId, file);
        currentCount += 1;
        uploaded += 1;
      }
      if (uploaded > 0) {
        toast.success(
          uploaded === 1 ? 'Imagem enviada' : `${uploaded} imagens enviadas`,
        );
        invalidate();
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Imagens</CardTitle>
          <CardDescription>
            Até {MAX_VEHICLE_PHOTOS} fotos por veículo ou produto (JPEG, PNG ou WebP — máx. 10
            MB cada). A principal aparece no estoque.
          </CardDescription>
          <p className="mt-1 text-xs font-medium text-brand-600">
            {photos.length}/{MAX_VEHICLE_PHOTOS} cadastrada(s)
            {canManage && !atLimit ? ` · ${remaining} vaga(s)` : ''}
          </p>
        </div>
        {canManage && !atLimit ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={VEHICLE_PHOTO_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Adicionar imagens
            </Button>
          </>
        ) : null}
      </CardHeader>
      <CardContent>
        {photosQuery.isLoading ? (
          <p className="text-sm text-brand-600">Carregando imagens…</p>
        ) : photos.length === 0 ? (
          <p className="text-sm text-brand-600">
            {canManage
              ? 'Nenhuma imagem ainda. Use o botão acima para enviar.'
              : 'Este item ainda não tem imagens.'}
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <PhotoTile
                key={photo.id}
                photo={photo}
                canManage={canManage}
                onSetPrimary={() => setPrimaryMutation.mutate(photo.id)}
                onDelete={() => deleteMutation.mutate(photo.id)}
                busy={
                  setPrimaryMutation.isPending || deleteMutation.isPending || uploading
                }
              />
            ))}
          </ul>
        )}
        {canManage && atLimit ? (
          <p className="mt-3 text-xs text-brand-600">
            Limite de {MAX_VEHICLE_PHOTOS} imagens atingido. Remova uma para adicionar outra.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function PhotoTile({
  photo,
  canManage,
  onSetPrimary,
  onDelete,
  busy,
}: {
  photo: VehiclePhoto;
  canManage: boolean;
  onSetPrimary: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const src = mediaUrl(photo.url);

  return (
    <li
      className={cn(
        'overflow-hidden rounded-lg border border-brand-100 bg-brand-50/50',
        photo.isPrimary && 'ring-2 ring-brand-500',
      )}
    >
      <div className="relative aspect-[4/3] bg-brand-100">
        {src ? (
          <Image
            src={src}
            alt={photo.fileName}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 280px"
            unoptimized
          />
        ) : null}
        {photo.isPrimary ? (
          <span className="absolute left-2 top-2 rounded bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
            Principal
          </span>
        ) : null}
      </div>
      {canManage ? (
        <div className="flex gap-1 border-t border-brand-100 p-2">
          {!photo.isPrimary ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              disabled={busy}
              onClick={onSetPrimary}
            >
              <Star className="h-3.5 w-3.5" />
              Principal
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-destructive hover:text-destructive"
            disabled={busy}
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        </div>
      ) : null}
    </li>
  );
}
