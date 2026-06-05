import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { CommissionRuleType } from '@prisma/client';
import { TENANT_USER_ROLES } from './create-user.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsIn(TENANT_USER_ROLES, {
    message: `Perfil deve ser um de: ${TENANT_USER_ROLES.join(', ')}`,
  })
  role?: (typeof TENANT_USER_ROLES)[number];

  /** Filial do usuário; null = matriz (tenant) */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUUID('4', { message: 'Filial inválida' })
  branchId?: string | null;

  @IsOptional()
  @IsEnum(CommissionRuleType)
  commissionType?: CommissionRuleType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  commissionValue?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  // Campos internos (usados na inativação)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deactivationReason?: string;
}
