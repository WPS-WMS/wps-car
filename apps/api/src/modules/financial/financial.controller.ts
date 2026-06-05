import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UpdateFinancialDto } from './dto/update-financial.dto';
import { SuggestPurchaseDto } from './dto/suggest-purchase.dto';
import { FinancialService } from './financial.service';

@Controller('vehicles/:vehicleId/financial')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get()
  @Permissions('financial:read')
  get(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.financialService.getByVehicle(vehicleId);
  }

  @Patch()
  @Permissions('financial:update')
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: UpdateFinancialDto,
  ) {
    return this.financialService.update(vehicleId, dto);
  }

  @Post('recalculate')
  @Permissions('financial:update')
  recalculate(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.financialService.recalculate(vehicleId);
  }

  @Post('suggest-purchase')
  @Permissions('financial:update')
  suggestPurchase(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: SuggestPurchaseDto,
  ) {
    return this.financialService.suggestPurchase(vehicleId, dto);
  }
}
