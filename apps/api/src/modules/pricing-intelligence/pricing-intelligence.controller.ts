import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AnalyzePricingDto } from './dto/analyze-pricing.dto';
import { ListPricingHistoryQueryDto } from './dto/list-pricing-history-query.dto';
import { PricingIntelligenceService } from './pricing-intelligence.service';

@Controller('pricing-intelligence')
export class PricingIntelligenceController {
  constructor(private readonly pricingIntelligenceService: PricingIntelligenceService) {}

  @Post('analyze')
  @Permissions('pricing-intelligence:read')
  analyze(@Body() dto: AnalyzePricingDto, @CurrentUser() actor: AuthenticatedUser) {
    return this.pricingIntelligenceService.analyze(dto, actor);
  }

  @Get('history')
  @Permissions('pricing-intelligence:read')
  listHistory(@Query() query: ListPricingHistoryQueryDto) {
    return this.pricingIntelligenceService.listHistory(query);
  }
}
