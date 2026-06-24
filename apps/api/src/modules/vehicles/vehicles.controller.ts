import {
  Body,
  Controller,
  Delete,
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
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { ListVehiclesQueryDto } from './dto/list-vehicles-query.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  @Permissions('vehicles:read')
  findAll(
    @Query() query: ListVehiclesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.vehiclesService.findAll(query, actor);
  }

  @Get('plate/:plate')
  @Permissions('vehicles:read')
  findByPlate(
    @Param('plate') plate: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.vehiclesService.findByPlate(plate, actor);
  }

  @Get(':id')
  @Permissions('vehicles:read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.vehiclesService.findById(id, actor);
  }

  @Post()
  @Permissions('vehicles:create')
  create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.vehiclesService.create(dto, actor);
  }

  @Patch(':id')
  @Permissions('vehicles:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.vehiclesService.update(id, dto, actor);
  }

  @Delete(':id')
  @Permissions('vehicles:delete')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.vehiclesService.remove(id, actor);
  }
}
