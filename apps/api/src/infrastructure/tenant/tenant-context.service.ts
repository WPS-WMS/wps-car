import { AsyncLocalStorage } from 'node:async_hooks';
import { ForbiddenException, Injectable } from '@nestjs/common';

interface TenantStore {
  tenantId: string | null;
  userId: string | null;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  run<T>(callback: () => T): T {
    return this.storage.run({ tenantId: null, userId: null }, callback);
  }

  private store(): TenantStore {
    const store = this.storage.getStore();

    if (!store) {
      throw new ForbiddenException('Contexto de requisição não inicializado');
    }

    return store;
  }

  setTenantId(tenantId: string | null) {
    this.store().tenantId = tenantId;
  }

  getTenantId(): string | null {
    return this.store().tenantId;
  }

  requireTenantId(): string {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      throw new ForbiddenException('Contexto de empresa não definido');
    }

    return tenantId;
  }

  setUserId(userId: string) {
    this.store().userId = userId;
  }

  getUserId(): string | null {
    return this.store().userId;
  }
}
