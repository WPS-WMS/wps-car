import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateCatalogItemDto } from './create-catalog-item.dto';

export class CreateStatusConfigDto extends CreateCatalogItemDto {
  @IsString()
  @MaxLength(50)
  entity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;
}
