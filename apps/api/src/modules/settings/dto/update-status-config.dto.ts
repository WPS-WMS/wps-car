import { IsOptional, IsString, MaxLength } from 'class-validator';
import { UpdateCatalogItemDto } from './update-catalog-item.dto';

export class UpdateStatusConfigDto extends UpdateCatalogItemDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
