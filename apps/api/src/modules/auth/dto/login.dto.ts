import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  /** CNPJ da revenda — obrigatório para usuários de tenant */
  @IsOptional()
  @IsString()
  tenantCnpj?: string;
}
