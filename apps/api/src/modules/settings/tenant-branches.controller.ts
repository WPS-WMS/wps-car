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
import { CreateTenantBranchDto } from './dto/create-tenant-branch.dto';
import { UpdateTenantBranchDto } from './dto/update-tenant-branch.dto';
import { TenantBranchesService } from './tenant-branches.service';

@Controller('settings/branches')
export class TenantBranchesController {
  constructor(private readonly service: TenantBranchesService) {}

  @Get()
  @Permissions('settings:read')
  list(@Query('activeOnly') activeOnly?: string) {
    return this.service.list(activeOnly === 'true');
  }

  @Post()
  @Permissions('settings:update')
  create(@Body() dto: CreateTenantBranchDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Permissions('settings:update')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTenantBranchDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Permissions('settings:update')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.deactivate(id);
  }
}
