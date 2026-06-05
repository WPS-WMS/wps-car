import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class PermissionOverrideDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsBoolean()
  granted!: boolean;
}

export class UpdateUserPermissionsDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => PermissionOverrideDto)
  permissions!: PermissionOverrideDto[];
}
