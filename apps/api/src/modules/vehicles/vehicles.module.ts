import { Module } from '@nestjs/common';
import { FinancialModule } from '../financial/financial.module';
import { VehiclePhotosController } from './vehicle-photos.controller';
import { VehiclePhotosService } from './vehicle-photos.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehiclePhotosRepository } from './repositories/vehicle-photos.repository';
import { VehiclesRepository } from './repositories/vehicles.repository';

@Module({
  imports: [FinancialModule],
  controllers: [VehiclesController, VehiclePhotosController],
  providers: [
    VehiclesService,
    VehiclePhotosService,
    VehiclesRepository,
    VehiclePhotosRepository,
  ],
  exports: [VehiclesService, VehiclesRepository],
})
export class VehiclesModule {}
