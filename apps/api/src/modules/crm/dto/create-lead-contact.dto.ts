import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ContactChannel } from '@prisma/client';

export class CreateLeadContactDto {
  @IsOptional()
  @IsEnum(ContactChannel)
  channel?: ContactChannel;

  @IsString()
  @IsNotEmpty()
  summary!: string;

  @Type(() => Date)
  @IsDate()
  contactedAt!: Date;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
