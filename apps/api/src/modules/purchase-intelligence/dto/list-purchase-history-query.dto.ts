import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsOptional, IsString } from 'class-validator';

export class ListPurchaseHistoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  licensePlate?: string;
}
