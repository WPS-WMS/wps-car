import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateVehicleCostDto } from './dto/create-vehicle-cost.dto';
import { ListVehicleCostsQueryDto } from './dto/list-vehicle-costs-query.dto';
import { UpdateVehicleCostDto } from './dto/update-vehicle-cost.dto';
import { VehicleCostsService } from './vehicle-costs.service';

@Controller('vehicles/:vehicleId/costs')
export class VehicleCostsController {
  constructor(
    private readonly costsService: VehicleCostsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @Permissions('costs:read')
  findAll(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query() query: ListVehicleCostsQueryDto,
  ) {
    return this.costsService.findAll(vehicleId, query);
  }

  @Get(':costId')
  @Permissions('costs:read')
  findOne(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('costId', ParseUUIDPipe) costId: string,
  ) {
    return this.costsService.findById(vehicleId, costId);
  }

  @Post()
  @Permissions('costs:create')
  create(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: CreateVehicleCostDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.costsService.create(vehicleId, dto, actor);
  }

  @Patch(':costId')
  @Permissions('costs:create')
  update(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('costId', ParseUUIDPipe) costId: string,
    @Body() dto: UpdateVehicleCostDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.costsService.update(vehicleId, costId, dto, actor);
  }

  @Delete(':costId')
  @Permissions('costs:create')
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('costId', ParseUUIDPipe) costId: string,
  ) {
    return this.costsService.remove(vehicleId, costId);
  }

  @Post(':costId/receipt')
  @Permissions('costs:create')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  uploadReceipt(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('costId', ParseUUIDPipe) costId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const maxMb = this.config.get<number>('upload.maxFileSizeMb') ?? 10;
    if (file && file.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`Arquivo excede ${maxMb}MB`);
    }
    return this.costsService.uploadReceipt(vehicleId, costId, file);
  }

  @Delete(':costId/receipt')
  @Permissions('costs:create')
  removeReceipt(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('costId', ParseUUIDPipe) costId: string,
  ) {
    return this.costsService.removeReceipt(vehicleId, costId);
  }
}
