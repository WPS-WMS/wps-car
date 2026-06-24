import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLeadInterestDto {
  @IsUUID()
  vehicleId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
