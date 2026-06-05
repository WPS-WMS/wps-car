import { Controller, Get, Query, Res } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ExportReportQueryDto } from './dto/export-report-query.dto';
import { GeneralReportQueryDto } from './dto/general-report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('general')
  @Permissions('reports:read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getGeneralReport(@Query() query: GeneralReportQueryDto) {
    return this.reportsService.getGeneralReport(query);
  }

  @Get('stock/export')
  @Permissions('reports:read')
  async exportStock(
    @Query() query: ExportReportQueryDto,
    @Res() res: Response,
  ) {
    const file = await this.reportsService.exportStock(query);
    this.sendFile(res, file.buffer, file.filename, file.mimeType);
  }

  @Get('sales/export')
  @Permissions('reports:read')
  async exportSales(
    @Query() query: ExportReportQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const file = await this.reportsService.exportSales(query, actor);
    this.sendFile(res, file.buffer, file.filename, file.mimeType);
  }

  @Get('summary/export')
  @Permissions('reports:read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async exportSummary(
    @Query() query: ExportReportQueryDto,
    @Res() res: Response,
  ) {
    const file = await this.reportsService.exportSummary(query);
    this.sendFile(res, file.buffer, file.filename, file.mimeType);
  }

  private sendFile(
    res: Response,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ) {
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
