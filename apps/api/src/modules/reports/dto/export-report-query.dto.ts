import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { SaleStatus } from '@prisma/client';
import { ScopeFiltersQueryDto } from '../../../common/dto/scope-filters-query.dto';

export enum ReportFormat {
  PDF = 'pdf',
  XLSX = 'xlsx',
}

export class ExportReportQueryDto extends ScopeFiltersQueryDto {
  @IsEnum(ReportFormat)
  format!: ReportFormat;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;
}
