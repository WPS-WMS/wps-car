import { IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  twoFactorToken!: string;

  @IsString()
  @Length(6, 8)
  code!: string;
}

export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 8)
  code!: string;
}

export class DisableTwoFactorDto extends TwoFactorCodeDto {
  @IsString()
  @MinLength(8)
  password!: string;
}
