import { IsOptional, IsString, IsUUID } from 'class-validator';

/** Filtros opcionais de escopo (admin). branchId: omitir/`all` = tudo; `matriz` = matriz; UUID = filial */
export class ScopeFiltersQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  sellerId?: string;
}
