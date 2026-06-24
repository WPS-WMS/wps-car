import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class AnalyzePricingDto {
  @IsUUID()
  vehicleId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(80)
  minMarginPercent?: number;
}
