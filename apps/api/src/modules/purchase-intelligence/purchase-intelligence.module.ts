import { Module } from '@nestjs/common';
import { FipeModule } from '../../infrastructure/fipe/fipe.module';
import { VehicleFinancialCalculatorService } from '../../domain/services/vehicle-financial-calculator.service';
import { SettingsModule } from '../settings/settings.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { PurchaseIntelligenceController } from './purchase-intelligence.controller';
import { PurchaseIntelligenceService } from './purchase-intelligence.service';
import { PurchaseIntelligenceRepository } from './repositories/purchase-intelligence.repository';

@Module({
  imports: [VehiclesModule, SettingsModule, FipeModule],
  controllers: [PurchaseIntelligenceController],
  providers: [
    PurchaseIntelligenceService,
    PurchaseIntelligenceRepository,
    VehicleFinancialCalculatorService,
  ],
})
export class PurchaseIntelligenceModule {}
