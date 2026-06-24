import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipTenant } from '../../common/decorators/skip-tenant.decorator';
import { PlatformMetricsQueryDto } from './dto/platform-metrics-query.dto';
import { PlatformService } from './platform.service';

@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @SkipTenant()
  @Get('metrics')
  @Roles(UserRole.MODERATOR)
  @Permissions('platform:metrics')
  getMetrics(@Query() query: PlatformMetricsQueryDto) {
    return this.platformService.getMetrics(query);
  }
}
