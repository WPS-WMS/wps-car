import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpsertEmailNotificationDto {
  @IsBoolean()
  active!: boolean;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject!: string;

  @IsString()
  @IsNotEmpty()
  bodyHtml!: string;
}
