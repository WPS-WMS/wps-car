import { Module } from '@nestjs/common';
import { AttachmentsRepository } from '../../infrastructure/storage/attachments.repository';
import { FinancialModule } from '../financial/financial.module';
import { VehicleDocumentsController } from './vehicle-documents.controller';
import { VehicleDocumentsService } from './vehicle-documents.service';
import { VehiclePhotosController } from './vehicle-photos.controller';
import { VehiclePhotosService } from './vehicle-photos.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehiclePhotosRepository } from './repositories/vehicle-photos.repository';
import { VehiclesRepository } from './repositories/vehicles.repository';

@Module({
  imports: [FinancialModule],
  controllers: [VehiclesController, VehiclePhotosController, VehicleDocumentsController],
  providers: [
    VehiclesService,
    VehiclePhotosService,
    VehicleDocumentsService,
    VehiclesRepository,
    VehiclePhotosRepository,
    AttachmentsRepository,
  ],
  exports: [VehiclesService, VehiclesRepository],
})
export class VehiclesModule {}
