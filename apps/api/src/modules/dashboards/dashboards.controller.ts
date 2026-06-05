import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardsService } from './dashboards.service';

@Controller('dashboard')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('manager')
  @Permissions('dashboard:read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  manager(@Query() query: DashboardQueryDto) {
    return this.dashboardsService.getManagerDashboard(query);
  }

  @Get('seller')
  @Permissions('dashboard:read')
  seller(
    @Query() query: DashboardQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.dashboardsService.getSellerDashboard(actor, query);
  }

  @Get('seller/ranking')
  @Permissions('dashboard:read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  sellerRanking(@Query() query: DashboardQueryDto) {
    return this.dashboardsService.getSellerRanking(query);
  }
}
