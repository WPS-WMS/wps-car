import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipTenant } from '../../common/decorators/skip-tenant.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { ListTenantsQueryDto } from './dto/list-tenants-query.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  getCurrent(@TenantId() tenantId: string | null) {
    if (!tenantId) {
      throw new ForbiddenException('Usuário sem empresa vinculada');
    }
    return this.tenantsService.getCurrent(tenantId);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  updateCurrent(
    @TenantId() tenantId: string | null,
    @Body() dto: UpdateTenantDto,
  ) {
    if (!tenantId) {
      throw new ForbiddenException('Usuário sem empresa vinculada');
    }
    return this.tenantsService.updateCurrent(tenantId, dto);
  }

  @SkipTenant()
  @Get()
  @Roles(UserRole.MODERATOR)
  @Permissions('tenants:read')
  findAll(@Query() query: ListTenantsQueryDto) {
    return this.tenantsService.findAll(query);
  }

  @SkipTenant()
  @Post()
  @Roles(UserRole.MODERATOR)
  @Permissions('tenants:manage')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @SkipTenant()
  @Get(':id')
  @Roles(UserRole.MODERATOR)
  @Permissions('tenants:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.findById(id);
  }

  @SkipTenant()
  @Patch(':id')
  @Roles(UserRole.MODERATOR)
  @Permissions('tenants:manage')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, dto);
  }
}
