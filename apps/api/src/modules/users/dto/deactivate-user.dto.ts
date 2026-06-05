import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class DeactivateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Motivo é obrigatório' })
  @MaxLength(500)
  reason!: string;
}

