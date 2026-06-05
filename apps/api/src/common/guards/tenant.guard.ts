import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { SKIP_TENANT_KEY } from '../constants/metadata-keys';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params?: Record<string, string>;
      headers?: Record<string, string>;
    }>();

    const user = request.user;

    if (!user) {
      return true;
    }

    if (!user.tenantId && user.role !== UserRole.MODERATOR) {
      throw new ForbiddenException('Contexto de empresa obrigatório');
    }

    if (skipTenant || user.role === UserRole.MODERATOR) {
      this.tenantContext.setTenantId(user.tenantId);
      this.tenantContext.setUserId(user.id);
      return true;
    }

    const headerTenantId = request.headers?.['x-tenant-id'];
    if (headerTenantId && headerTenantId !== user.tenantId) {
      throw new ForbiddenException('Tenant do header não corresponde ao usuário');
    }

    const paramTenantId = request.params?.tenantId;
    if (paramTenantId && paramTenantId !== user.tenantId) {
      throw new ForbiddenException('Acesso negado a dados de outra empresa');
    }

    this.tenantContext.setTenantId(user.tenantId);
    this.tenantContext.setUserId(user.id);
    return true;
  }
}
