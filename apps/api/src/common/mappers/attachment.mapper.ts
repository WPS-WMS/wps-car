import { Attachment } from '@prisma/client';

export function toAttachmentResponse(attachment: Attachment) {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    url: `/uploads/${attachment.filePath}`,
    createdAt: attachment.createdAt,
  };
}
