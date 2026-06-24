import { Attachment, VehicleDocumentType } from '@prisma/client';

export function toAttachmentResponse(attachment: Attachment) {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    documentType: attachment.documentType,
    url: `/files/${attachment.filePath}`,
    createdAt: attachment.createdAt,
  };
}

export const VEHICLE_DOCUMENT_LABELS: Record<VehicleDocumentType, string> = {
  CRLV: 'CRLV',
  INVOICE: 'Nota fiscal',
  PURCHASE_CONTRACT: 'Contrato de compra',
  SALE_CONTRACT: 'Contrato de venda',
  CAUTELAR_REPORT: 'Laudo cautelar',
  OTHER: 'Outro documento',
};
