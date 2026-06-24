import { Module } from '@nestjs/common';
import { FinancialModule } from '../financial/financial.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { SalesRepository } from './repositories/sales.repository';

@Module({
  imports: [FinancialModule, NotificationsModule],
  controllers: [SalesController],
  providers: [SalesService, SalesRepository],
  exports: [SalesService, SalesRepository],
})
export class SalesModule {}
