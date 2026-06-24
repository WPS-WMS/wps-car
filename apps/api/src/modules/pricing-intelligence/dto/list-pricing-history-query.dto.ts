import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPricingHistoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
