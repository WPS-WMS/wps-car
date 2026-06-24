import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AnalyzePurchaseDto } from './dto/analyze-purchase.dto';
import { ListPurchaseHistoryQueryDto } from './dto/list-purchase-history-query.dto';
import { PurchaseIntelligenceService } from './purchase-intelligence.service';

@Controller('purchase-intelligence')
export class PurchaseIntelligenceController {
  constructor(private readonly purchaseIntelligenceService: PurchaseIntelligenceService) {}

  @Post('analyze')
  @Permissions('purchase-intelligence:read')
  analyze(@Body() dto: AnalyzePurchaseDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.purchaseIntelligenceService.analyze(dto, actor);
  }

  @Get('history')
  @Permissions('purchase-intelligence:read')
  listHistory(@Query() query: ListPurchaseHistoryQueryDto) {
    return this.purchaseIntelligenceService.listHistory(query);
  }
}
