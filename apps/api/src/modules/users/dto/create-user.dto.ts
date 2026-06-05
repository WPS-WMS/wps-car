import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CommissionRuleType, UserRole } from '@prisma/client';

const ALLOWED_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.SELLER] as const;

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsIn(ALLOWED_ROLES, {
    message: `Perfil deve ser um de: ${ALLOWED_ROLES.join(', ')}`,
  })
  role!: (typeof ALLOWED_ROLES)[number];

  /** Filial do usuário; omitir ou null = matriz (tenant) */
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined && value !== '')
  @IsUUID('4', { message: 'Filial inválida' })
  branchId?: string | null;

  // Comissão padrão do vendedor (apenas para role SELLER)
  @IsOptional()
  @IsEnum(CommissionRuleType)
  commissionType?: CommissionRuleType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  commissionValue?: number;
}

export { ALLOWED_ROLES as TENANT_USER_ROLES };
