import { IsEnum, IsOptional } from 'class-validator';
import { ReminderStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListRemindersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReminderStatus)
  status?: ReminderStatus;
}
