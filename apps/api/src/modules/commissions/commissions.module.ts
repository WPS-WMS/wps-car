import { Module } from '@nestjs/common';
import { FinancialModule } from '../financial/financial.module';
import {
  CommissionRulesController,
  VehicleCommissionController,
} from './commission-rules.controller';
import { CommissionRulesService } from './commission-rules.service';
import { CommissionRulesRepository } from './repositories/commission-rules.repository';

@Module({
  imports: [FinancialModule],
  controllers: [CommissionRulesController, VehicleCommissionController],
  providers: [CommissionRulesService, CommissionRulesRepository],
  exports: [CommissionRulesService],
})
export class CommissionsModule {}
