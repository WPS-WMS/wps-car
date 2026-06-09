import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { SaleStatus, VehicleType } from '@prisma/client';
import { ScopeFiltersQueryDto } from '../../../common/dto/scope-filters-query.dto';

export class GeneralReportQueryDto extends ScopeFiltersQueryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;
}
