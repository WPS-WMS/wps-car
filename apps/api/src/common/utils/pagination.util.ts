import { PaginationQueryDto } from '../dto/pagination-query.dto';

export function resolvePagination(query: PaginationQueryDto) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const orderBy = query.sortBy
    ? { [query.sortBy]: query.sortOrder ?? 'desc' }
    : undefined;

  return { page, limit, skip, orderBy };
}
