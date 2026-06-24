import { VehicleDocumentType } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UploadVehicleDocumentDto {
  @IsEnum(VehicleDocumentType)
  documentType!: VehicleDocumentType;
}
