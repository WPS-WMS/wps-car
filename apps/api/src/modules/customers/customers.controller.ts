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
import { CreateCustomerDto } from './dto/create-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { AddHistoryNoteDto } from './dto/add-history-note.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { CustomersService } from './customers.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Permissions('customers:read')
  findAll(
    @Query() query: ListCustomersQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.customersService.findAll(query, actor);
  }

  @Get(':id')
  @Permissions('customers:read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.customersService.findById(id, actor);
  }

  @Post()
  @Permissions('customers:create')
  create(
    @Body() dto: CreateCustomerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.customersService.create(dto, actor);
  }

  @Patch(':id')
  @Permissions('customers:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.customersService.update(id, dto, actor);
  }

  @Patch(':id/deactivate')
  @Permissions('customers:update')
  deactivate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.customersService.deactivate(id, actor);
  }

  @Get(':id/history')
  @Permissions('customers:read')
  getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: HistoryQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.customersService.getHistory(
      id,
      query.page,
      query.limit,
      actor,
    );
  }

  @Post(':id/history')
  @Permissions('customers:update')
  addNote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddHistoryNoteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.customersService.addNote(id, dto, actor);
  }
}
