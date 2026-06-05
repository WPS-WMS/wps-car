import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { StockMovementType, VehicleStatus } from '@prisma/client';

export class CreateStockMovementDto {
  @IsUUID()
  vehicleId!: string;

  @IsEnum(StockMovementType)
  type!: StockMovementType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;
}
