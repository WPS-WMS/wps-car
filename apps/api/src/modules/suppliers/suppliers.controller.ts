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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AddHistoryNoteDto } from '../customers/dto/add-history-note.dto';
import { HistoryQueryDto } from '../customers/dto/history-query.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers-query.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @Permissions('suppliers:read')
  findAll(@Query() query: ListSuppliersQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  @Permissions('suppliers:read')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findById(id);
  }

  @Post()
  @Permissions('suppliers:create')
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.suppliersService.create(dto, actor);
  }

  @Patch(':id')
  @Permissions('suppliers:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.suppliersService.update(id, dto, actor);
  }

  @Patch(':id/deactivate')
  @Permissions('suppliers:update')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.suppliersService.deactivate(id, actor);
  }

  @Get(':id/purchases')
  @Permissions('suppliers:read')
  getPurchases(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.getPurchasedVehicles(id);
  }

  @Get(':id/history')
  @Permissions('suppliers:read')
  getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: HistoryQueryDto,
  ) {
    return this.suppliersService.getHistory(id, query.page, query.limit);
  }

  @Post(':id/history')
  @Permissions('suppliers:update')
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddHistoryNoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.suppliersService.addNote(id, dto, actor);
  }
}
