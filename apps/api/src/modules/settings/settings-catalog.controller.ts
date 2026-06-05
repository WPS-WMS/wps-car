import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { CreateStatusConfigDto } from './dto/create-status-config.dto';
import { UpdateStatusConfigDto } from './dto/update-status-config.dto';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';
import { ConfigCatalogService } from './config-catalog.service';

@Controller('settings/vehicle-types')
export class VehicleTypesConfigController {
  constructor(private readonly catalog: ConfigCatalogService) {}

  @Get()
  @Permissions('settings:read')
  list(@Query('activeOnly') activeOnly?: string) {
    return this.catalog.listVehicleTypes(activeOnly === 'true');
  }

  @Post()
  @Permissions('settings:update')
  create(@Body() dto: CreateCatalogItemDto) {
    return this.catalog.createVehicleType(dto);
  }

  @Patch(':id')
  @Permissions('settings:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogItemDto) {
    return this.catalog.updateVehicleType(id, dto);
  }

  @Patch(':id/deactivate')
  @Permissions('settings:update')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deactivateVehicleType(id);
  }
}

@Controller('settings/cost-types')
export class CostTypesConfigController {
  constructor(private readonly catalog: ConfigCatalogService) {}

  @Get()
  @Permissions('settings:read')
  list(@Query('activeOnly') activeOnly?: string) {
    return this.catalog.listCostTypes(activeOnly === 'true');
  }

  @Post()
  @Permissions('settings:update')
  create(@Body() dto: CreateCatalogItemDto) {
    return this.catalog.createCostType(dto);
  }

  @Patch(':id')
  @Permissions('settings:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogItemDto) {
    return this.catalog.updateCostType(id, dto);
  }

  @Patch(':id/deactivate')
  @Permissions('settings:update')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deactivateCostType(id);
  }
}

@Controller('settings/payment-methods')
export class PaymentMethodsConfigController {
  constructor(private readonly catalog: ConfigCatalogService) {}

  @Get()
  @Permissions('settings:read')
  list(@Query('activeOnly') activeOnly?: string) {
    return this.catalog.listPaymentMethods(activeOnly === 'true');
  }

  @Post()
  @Permissions('settings:update')
  create(@Body() dto: CreateCatalogItemDto) {
    return this.catalog.createPaymentMethod(dto);
  }

  @Patch(':id')
  @Permissions('settings:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCatalogItemDto) {
    return this.catalog.updatePaymentMethod(id, dto);
  }

  @Patch(':id/deactivate')
  @Permissions('settings:update')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deactivatePaymentMethod(id);
  }
}

@Controller('settings/statuses')
export class StatusesConfigController {
  constructor(private readonly catalog: ConfigCatalogService) {}

  @Get()
  @Permissions('settings:read')
  list(
    @Query('entity') entity?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.catalog.listStatuses(entity, activeOnly === 'true');
  }

  @Post()
  @Permissions('settings:update')
  create(@Body() dto: CreateStatusConfigDto) {
    return this.catalog.createStatus(dto);
  }

  @Patch(':id')
  @Permissions('settings:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusConfigDto) {
    return this.catalog.updateStatus(id, dto);
  }

  @Patch(':id/deactivate')
  @Permissions('settings:update')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deactivateStatus(id);
  }
}

@Controller('settings/email-templates')
export class EmailTemplatesConfigController {
  constructor(private readonly catalog: ConfigCatalogService) {}

  @Get()
  @Permissions('settings:read')
  list(@Query('activeOnly') activeOnly?: string) {
    return this.catalog.listEmailTemplates(activeOnly === 'true');
  }

  @Post()
  @Permissions('settings:update')
  create(@Body() dto: CreateEmailTemplateDto) {
    return this.catalog.createEmailTemplate(dto);
  }

  @Patch(':id')
  @Permissions('settings:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.catalog.updateEmailTemplate(id, dto);
  }

  @Patch(':id/deactivate')
  @Permissions('settings:update')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deactivateEmailTemplate(id);
  }
}
