import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  /** CNPJ da revenda — opcional; sem ele, a empresa é resolvida pelo e-mail do usuário */
  @IsOptional()
  @IsString()
  tenantCnpj?: string;
}
