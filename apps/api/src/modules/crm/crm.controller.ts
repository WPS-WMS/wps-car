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
import { CrmService } from './crm.service';
import { CreateLeadContactDto } from './dto/create-lead-contact.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateLeadInterestDto } from './dto/create-lead-interest.dto';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { ListLeadsQueryDto } from './dto/list-leads-query.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { ListRemindersQueryDto } from './dto/list-reminders-query.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('funnel')
  @Permissions('crm:read')
  getFunnel(@CurrentUser() actor: AuthenticatedUser) {
    return this.crmService.getFunnel(actor);
  }

  @Get('reminders')
  @Permissions('crm:read')
  findAllReminders(
    @Query() query: ListRemindersQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.findAllReminders(query, actor);
  }

  @Patch('reminders/:id/complete')
  @Permissions('crm:update')
  completeReminder(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.completeReminder(id, actor);
  }

  @Get('opportunities')
  @Permissions('crm:read')
  findAllOpportunities(
    @Query() query: ListOpportunitiesQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.findAllOpportunities(query, actor);
  }

  @Post('opportunities')
  @Permissions('crm:create')
  createOpportunity(
    @Body() dto: CreateOpportunityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.createOpportunity(dto, actor);
  }

  @Patch('opportunities/:id')
  @Permissions('crm:update')
  updateOpportunity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOpportunityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.updateOpportunity(id, dto, actor);
  }

  @Get('leads')
  @Permissions('crm:read')
  findAllLeads(
    @Query() query: ListLeadsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.findAllLeads(query, actor);
  }

  @Post('leads')
  @Permissions('crm:create')
  createLead(
    @Body() dto: CreateLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.createLead(dto, actor);
  }

  @Get('leads/:id')
  @Permissions('crm:read')
  findLeadById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.findLeadById(id, actor);
  }

  @Patch('leads/:id')
  @Permissions('crm:update')
  updateLead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.updateLead(id, dto, actor);
  }

  @Post('leads/:id/contacts')
  @Permissions('crm:create')
  createLeadContact(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLeadContactDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.createLeadContact(id, dto, actor);
  }

  @Post('leads/:id/interests')
  @Permissions('crm:create')
  createLeadInterest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateLeadInterestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.crmService.createLeadInterest(id, dto, actor);
  }
}
