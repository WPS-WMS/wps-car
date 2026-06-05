import { Module } from '@nestjs/common';
import { VehicleFinancialCalculatorService } from '../../domain/services/vehicle-financial-calculator.service';
import { FinancialController } from './financial.controller';
import { FinancialService } from './financial.service';
import { FinancialRepository } from './repositories/financial.repository';
import { FinancialRecalculationService } from './services/financial-recalculation.service';

@Module({
  controllers: [FinancialController],
  providers: [
    FinancialService,
    FinancialRepository,
    FinancialRecalculationService,
    VehicleFinancialCalculatorService,
  ],
  exports: [FinancialRecalculationService, FinancialRepository],
})
export class FinancialModule {}
