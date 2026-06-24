import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { ExportJobType, SaleStatus } from '@prisma/client';
import { ScopeFiltersQueryDto } from '../../../common/dto/scope-filters-query.dto';
import { ReportFormat } from './export-report-query.dto';

export class CreateExportJobDto extends ScopeFiltersQueryDto {
  @IsEnum(ExportJobType)
  type!: ExportJobType;

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
