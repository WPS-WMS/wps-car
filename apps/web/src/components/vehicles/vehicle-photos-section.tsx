'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError } from '@/lib/api';
import {
  isAllowedVehiclePhoto,
  MAX_VEHICLE_PHOTOS,
  VEHICLE_PHOTO_ACCEPT,
} from '@/lib/vehicle-photos';
import type { VehiclePhoto } from '@/types/api';
import {
  useVehiclePhotoViewer,
  VehiclePhotoThumb,
} from '@/components/vehicles/vehicle-photo-viewer';
import { vehiclePhotoListUrl } from '@/lib/vehicle-photo';
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

  const viewer = useVehiclePhotoViewer({ photos });

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
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Imagens</CardTitle>
            <CardDescription>
              Miniaturas compactas para consulta rápida. Clique para ampliar e navegar entre as
              fotos. A principal aparece no estoque.
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
            <ul className="flex flex-wrap gap-3">
              {photos.map((photo, photoIndex) => (
                <PhotoTile
                  key={photo.id}
                  photo={photo}
                  photoIndex={photoIndex}
                  canManage={canManage}
                  onOpen={() => viewer.openAt(photoIndex)}
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
      {viewer.lightbox}
    </>
  );
}

function PhotoTile({
  photo,
  photoIndex,
  canManage,
  onOpen,
  onSetPrimary,
  onDelete,
  busy,
}: {
  photo: VehiclePhoto;
  photoIndex: number;
  canManage: boolean;
  onOpen: () => void;
  onSetPrimary: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  return (
    <li
      className={cn(
        'flex flex-col items-center gap-1.5',
        photo.isPrimary && '[&_button]:ring-brand-500',
      )}
    >
      <VehiclePhotoThumb
        path={vehiclePhotoListUrl(photo)}
        alt={photo.fileName}
        size="lg"
        isPrimary={photo.isPrimary}
        onClick={onOpen}
      />
      {canManage ? (
        <div className="flex max-w-20 flex-wrap justify-center gap-0.5">
          {!photo.isPrimary ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-[10px]"
              disabled={busy}
              onClick={onSetPrimary}
              title="Definir como principal"
            >
              <Star className="h-3 w-3" />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-1.5 text-[10px] text-destructive hover:text-destructive"
            disabled={busy}
            onClick={onDelete}
            title="Excluir imagem"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground">#{photoIndex + 1}</span>
      )}
    </li>
  );
}
