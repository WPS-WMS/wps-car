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
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateSaleDto } from './dto/create-sale.dto';
import { ListSalesQueryDto } from './dto/list-sales-query.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { CommissionReportQueryDto } from './dto/commission-report-query.dto';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Permissions('sales:read')
  findAll(
    @Query() query: ListSalesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.salesService.findAll(query, actor);
  }

  @Get('commissions/me')
  @Permissions('commissions:read')
  myCommissions(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListSalesQueryDto,
  ) {
    return this.salesService.getMyCommissionSummary(
      actor,
      query.startDate,
      query.endDate,
    );
  }

  @Get('commissions/report')
  @Permissions('commissions:read')
  commissionReport(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: CommissionReportQueryDto,
  ) {
    return this.salesService.getCommissionReport(actor, query);
  }

  @Get('commissions/seller/:sellerId')
  @Permissions('sales:read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  sellerCommissions(
    @Param('sellerId', ParseUUIDPipe) sellerId: string,
    @Query() query: ListSalesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.salesService.getSellerCommissionSummary(
      sellerId,
      query.startDate,
      query.endDate,
      actor,
    );
  }

  @Get(':id')
  @Permissions('sales:read')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.salesService.findById(id, actor);
  }

  @Post()
  @Permissions('sales:create')
  create(
    @Body() dto: CreateSaleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.salesService.create(dto, actor);
  }

  @Patch(':id')
  @Permissions('sales:update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSaleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.salesService.update(id, dto, actor);
  }
}
