import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipTenant } from '../../common/decorators/skip-tenant.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from './audit.service';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @SkipTenant()
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @Permissions('settings:read')
  list(@Query() query: ListAuditLogsQueryDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.auditService.findMany(query, actor);
  }
}
