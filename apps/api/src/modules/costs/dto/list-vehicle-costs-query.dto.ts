import { IsEnum, IsOptional } from 'class-validator';
import { VehicleCostType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListVehicleCostsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(VehicleCostType)
  type?: VehicleCostType;
}
