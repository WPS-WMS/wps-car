'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ExternalLink, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { vehicleDocumentTypeLabels } from '@/lib/crm-labels';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { mediaUrl } from '@/lib/media';
import { useAuthenticatedMediaDownload } from '@/hooks/use-authenticated-media';
import type { VehicleDocument, VehicleDocumentType } from '@/types/api';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormSelect } from './form-field';

const DOCUMENT_TYPE_OPTIONS = Object.entries(vehicleDocumentTypeLabels).map(([value, label]) => ({
  value,
  label,
}));

function formatFileSize(bytes: number | null | undefined) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VehicleDocumentsPanel({
  vehicleId,
  canManage,
}: {
  vehicleId: string;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const downloadMedia = useAuthenticatedMediaDownload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState<VehicleDocumentType>('CRLV');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const documentsQuery = useQuery({
    queryKey: ['vehicle-documents', vehicleId],
    queryFn: () => api.getVehicleDocuments(vehicleId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadVehicleDocument(vehicleId, file, documentType),
    onSuccess: () => {
      toast.success('Documento enviado');
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['vehicle-documents', vehicleId] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao enviar documento');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: string) => api.deleteVehicleDocument(vehicleId, documentId),
    onSuccess: () => {
      toast.success('Documento removido');
      queryClient.invalidateQueries({ queryKey: ['vehicle-documents', vehicleId] });
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao remover documento');
    },
  });

  const documents = documentsQuery.data ?? [];

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setPendingFile(file);
    uploadMutation.mutate(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anexos e documentos</CardTitle>
        <CardDescription>
          CRLV, nota fiscal, contratos, laudo cautelar e outros arquivos do veículo. Fotos ficam na
          ficha de dados; comprovantes de custo na aba Custos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {canManage ? (
          <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <FormSelect
                label="Tipo de documento"
                value={documentType}
                onChange={(value) => setDocumentType(value as VehicleDocumentType)}
                options={DOCUMENT_TYPE_OPTIONS}
              />
            </div>
            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Enviar arquivo
              </Button>
            </div>
          </div>
        ) : null}

        {documentsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando documentos…</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Tipo</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead className="hidden md:table-cell">Tamanho</TableHead>
                  <TableHead className="hidden sm:table-cell">Enviado em</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    canManage={canManage}
                    onDownload={() => downloadMedia(doc.url, doc.fileName)}
                    onDelete={() => deleteMutation.mutate(doc.id)}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
                {!documents.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Nenhum documento anexado
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        )}

        {pendingFile && uploadMutation.isPending ? (
          <p className="text-xs text-muted-foreground">Enviando {pendingFile.name}…</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function DocumentRow({
  doc,
  canManage,
  onDownload,
  onDelete,
  isDeleting,
}: {
  doc: VehicleDocument;
  canManage: boolean;
  onDownload: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const viewUrl = mediaUrl(doc.url);
  const typeLabel = doc.documentType
    ? vehicleDocumentTypeLabels[doc.documentType]
    : 'Documento';

  return (
    <TableRow className="bg-white">
      <TableCell>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          {typeLabel}
        </div>
      </TableCell>
      <TableCell className="max-w-[220px] truncate">{doc.fileName}</TableCell>
      <TableCell className="hidden md:table-cell">{formatFileSize(doc.sizeBytes)}</TableCell>
      <TableCell className="hidden sm:table-cell">{formatDate(doc.createdAt)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {viewUrl ? (
            <a
              href={viewUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir"
              className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'inline-flex h-7 w-7 p-0')}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
          <Button type="button" size="sm" variant="ghost" onClick={onDownload} title="Baixar">
            <FileText className="h-4 w-4" />
          </Button>
          {canManage ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isDeleting}
              onClick={onDelete}
              title="Remover"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  );
}
