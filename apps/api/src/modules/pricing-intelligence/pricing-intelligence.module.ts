import { Module } from '@nestjs/common';
import { PricingEngineService } from '../../domain/services/pricing-engine.service';
import { FipeModule } from '../../infrastructure/fipe/fipe.module';
import { MarketModule } from '../../infrastructure/market/market.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { SettingsModule } from '../settings/settings.module';
import { PricingIntelligenceController } from './pricing-intelligence.controller';
import { PricingIntelligenceService } from './pricing-intelligence.service';
import { PricingIntelligenceRepository } from './repositories/pricing-intelligence.repository';
import { PricingMarketDataRepository } from './repositories/pricing-market-data.repository';

@Module({
  imports: [FipeModule, MarketModule, VehiclesModule, SettingsModule],
  controllers: [PricingIntelligenceController],
  providers: [
    PricingIntelligenceService,
    PricingIntelligenceRepository,
    PricingMarketDataRepository,
    PricingEngineService,
  ],
})
export class PricingIntelligenceModule {}
