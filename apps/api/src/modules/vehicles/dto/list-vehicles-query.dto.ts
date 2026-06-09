import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VehicleStatus, VehicleType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListVehiclesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  licensePlate?: string;

  /** Admin: filtrar por filial (`matriz` ou id da filial) */
  @IsOptional()
  @IsString()
  branchId?: string;
}
