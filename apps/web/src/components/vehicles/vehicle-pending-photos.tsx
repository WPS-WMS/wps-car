'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ImagePlus, X } from 'lucide-react';
import {
  isAllowedVehiclePhoto,
  MAX_VEHICLE_PHOTOS,
  VEHICLE_PHOTO_ACCEPT,
} from '@/lib/vehicle-photos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function VehiclePendingPhotos({
  files,
  onChange,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const atLimit = files.length >= MAX_VEHICLE_PHOTOS;

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  function addFiles(list: FileList | null) {
    if (!list?.length || disabled) return;

    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_VEHICLE_PHOTOS) {
        toast.error(`Máximo de ${MAX_VEHICLE_PHOTOS} imagens`);
        break;
      }
      if (!isAllowedVehiclePhoto(file)) {
        toast.error(`${file.name}: use JPEG, PNG ou WebP`);
        continue;
      }
      next.push(file);
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(files.filter((_, i) => i !== index));
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Imagens</CardTitle>
          <CardDescription>
            Adicione até {MAX_VEHICLE_PHOTOS} fotos (JPEG, PNG ou WebP). Serão enviadas ao
            salvar o cadastro. A primeira será a principal no estoque.
          </CardDescription>
          <p className="mt-1 text-xs font-medium text-brand-600">
            {files.length}/{MAX_VEHICLE_PHOTOS} selecionada(s)
          </p>
        </div>
        {!disabled ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept={VEHICLE_PHOTO_ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={atLimit}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="h-4 w-4" />
              Adicionar imagens
            </Button>
          </>
        ) : null}
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-brand-600">
            Nenhuma imagem selecionada. Clique em &quot;Adicionar imagens&quot; para incluir até{' '}
            {MAX_VEHICLE_PHOTOS}.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${index}`}
                className="relative overflow-hidden rounded-lg border border-brand-100 bg-brand-50/50"
              >
                <div className="relative aspect-[4/3] bg-brand-100">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                      Principal
                    </span>
                  ) : null}
                </div>
                {!disabled ? (
                  <div className="flex items-center justify-between gap-2 border-t border-brand-100 p-2 text-xs text-brand-700">
                    <span className="truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeAt(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
