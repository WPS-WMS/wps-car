import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateCommissionRuleDto } from './dto/create-commission-rule.dto';
import { UpdateCommissionRuleDto } from './dto/update-commission-rule.dto';
import { UpsertVehicleCommissionDto } from './dto/upsert-vehicle-commission.dto';
import { CommissionRulesService } from './commission-rules.service';

@Controller('commission-rules')
export class CommissionRulesController {
  constructor(private readonly service: CommissionRulesService) {}

  @Get()
  @Permissions('commissions:read')
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.service.findAll(activeOnly === 'true');
  }

  @Get(':id')
  @Permissions('commissions:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findById(id);
  }

  @Post()
  @Permissions('commissions:configure')
  create(@Body() dto: CreateCommissionRuleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('commissions:configure')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommissionRuleDto,
  ) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Permissions('commissions:configure')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }
}

@Controller('vehicles/:vehicleId/commission-override')
export class VehicleCommissionController {
  constructor(private readonly service: CommissionRulesService) {}

  @Get()
  @Permissions('commissions:read')
  get(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.service.getVehicleOverride(vehicleId);
  }

  @Put()
  @Permissions('commissions:configure')
  upsert(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: UpsertVehicleCommissionDto,
  ) {
    return this.service.upsertVehicleOverride(vehicleId, dto);
  }

  @Delete()
  @Permissions('commissions:configure')
  remove(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.service.removeVehicleOverride(vehicleId);
  }
}
