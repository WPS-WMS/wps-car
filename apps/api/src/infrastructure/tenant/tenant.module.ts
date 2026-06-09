import { Global, Module } from '@nestjs/common';
import { DataScopeService } from '../scope/data-scope.service';
import { TenantContextMiddleware } from './tenant-context.middleware';
import { TenantContextService } from './tenant-context.service';

@Global()
@Module({
  providers: [TenantContextService, TenantContextMiddleware, DataScopeService],
  exports: [TenantContextService, TenantContextMiddleware, DataScopeService],
})
export class TenantModule {}
