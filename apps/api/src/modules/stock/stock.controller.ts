import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ListVehiclesQueryDto } from '../vehicles/dto/list-vehicles-query.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { ListStockMovementsQueryDto } from './dto/list-stock-movements-query.dto';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @Permissions('stock:read')
  listInventory(
    @Query() query: ListVehiclesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.stockService.listInventory(query, actor);
  }

  @Get('plate/:plate')
  @Permissions('stock:read')
  findByPlate(
    @Param('plate') plate: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.stockService.findByPlate(plate, actor);
  }

  @Get('movements')
  @Permissions('stock:read')
  listMovements(@Query() query: ListStockMovementsQueryDto) {
    return this.stockService.listMovements(query);
  }

  @Post('movements')
  @Permissions('stock:move')
  createMovement(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.stockService.createMovement(dto, actor);
  }
}
