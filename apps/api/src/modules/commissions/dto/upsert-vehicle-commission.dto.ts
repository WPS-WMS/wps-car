import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min } from 'class-validator';
import { CommissionRuleType } from '@prisma/client';

export class UpsertVehicleCommissionDto {
  @IsEnum(CommissionRuleType)
  type!: CommissionRuleType;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  value!: number;
}
