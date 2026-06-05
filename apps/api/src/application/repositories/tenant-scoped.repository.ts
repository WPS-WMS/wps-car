import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';

/**
 * Base para repositórios que devem sempre filtrar por tenant.
 * Módulos de negócio (veículos, clientes…) devem estender esta classe.
 */
export abstract class TenantScopedRepository {
  constructor(protected readonly tenantContext: TenantContextService) {}

  protected getTenantFilter(): { tenantId: string } {
    return { tenantId: this.tenantContext.requireTenantId() };
  }
}
