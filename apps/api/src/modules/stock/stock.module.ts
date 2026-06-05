import { Module } from '@nestjs/common';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { StockRepository } from './repositories/stock.repository';

@Module({
  imports: [VehiclesModule],
  controllers: [StockController],
  providers: [StockService, StockRepository],
})
export class StockModule {}
