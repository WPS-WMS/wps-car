import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { ScopeFiltersQueryDto } from '../../../common/dto/scope-filters-query.dto';

export class DashboardQueryDto extends ScopeFiltersQueryDto {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}
