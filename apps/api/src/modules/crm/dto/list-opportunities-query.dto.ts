import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { OpportunityStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListOpportunitiesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OpportunityStatus)
  status?: OpportunityStatus;

  @IsOptional()
  @IsUUID()
  sellerId?: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
