import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { SaleStatus } from '@prisma/client';

export enum ReportFormat {
  PDF = 'pdf',
  XLSX = 'xlsx',
}

export class ExportReportQueryDto {
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
