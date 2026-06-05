import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_TENANT_KEY } from '../constants/metadata-keys';
import { TenantContextService } from '../../infrastructure/tenant/tenant-context.service';
import { AuthenticatedUser } from '../../modules/auth/interfaces/authenticated-user.interface';

/** Após o JWT, preenche o tenant no contexto (AsyncLocalStorage). */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const skipTenant = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!skipTenant) {
      const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
      const user = request.user;

      if (user) {
        this.tenantContext.setTenantId(user.tenantId);
        this.tenantContext.setUserId(user.id);
      }
    }

    return next.handle();
  }
}
