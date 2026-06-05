import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min, ValidateIf } from 'class-validator';

export class SuggestPurchaseDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fipeValue!: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedCosts!: number;

  @ValidateIf((o) => o.desiredMarginAmount === undefined)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  desiredMarginPercent?: number;

  @ValidateIf((o) => o.desiredMarginPercent === undefined)
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  desiredMarginAmount?: number;
}
