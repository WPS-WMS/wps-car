import { Module } from '@nestjs/common';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';
import { DashboardsRepository } from './dashboards.repository';

@Module({
  controllers: [DashboardsController],
  providers: [DashboardsService, DashboardsRepository],
  exports: [DashboardsRepository],
})
export class DashboardsModule {}
