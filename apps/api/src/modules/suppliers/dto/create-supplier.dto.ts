import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PersonType, SupplierCategory } from '@prisma/client';
import { AddressFieldsDto } from '../../../common/dto/address-fields.dto';

export class CreateSupplierDto extends AddressFieldsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  document!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(PersonType)
  personType?: PersonType;

  @IsEnum(SupplierCategory)
  category!: SupplierCategory;

  @IsOptional()
  @IsString()
  notes?: string;
}
