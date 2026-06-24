import { Module } from '@nestjs/common';
import { MarketListingsService } from './market-listings.service';

@Module({
  providers: [MarketListingsService],
  exports: [MarketListingsService],
})
export class MarketModule {}
