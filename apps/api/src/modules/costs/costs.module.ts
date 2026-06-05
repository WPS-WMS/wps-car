import { Module } from '@nestjs/common';
import { FinancialModule } from '../financial/financial.module';
import { AttachmentsRepository } from '../../infrastructure/storage/attachments.repository';
import { VehicleCostsController } from './vehicle-costs.controller';
import { VehicleCostsService } from './vehicle-costs.service';
import { VehicleCostsRepository } from './repositories/vehicle-costs.repository';

@Module({
  imports: [FinancialModule],
  controllers: [VehicleCostsController],
  providers: [VehicleCostsService, VehicleCostsRepository, AttachmentsRepository],
})
export class CostsModule {}
