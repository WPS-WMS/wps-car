import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { UploadVehicleDocumentDto } from './dto/upload-vehicle-document.dto';
import { VehicleDocumentsService } from './vehicle-documents.service';

@Controller('vehicles/:vehicleId/documents')
export class VehicleDocumentsController {
  constructor(
    private readonly documentsService: VehicleDocumentsService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @Permissions('vehicles:read')
  list(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.documentsService.list(vehicleId);
  }

  @Post()
  @Permissions('vehicles:update')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  upload(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body() dto: UploadVehicleDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const maxMb = this.config.get<number>('upload.maxFileSizeMb') ?? 10;
    if (file && file.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`Arquivo excede ${maxMb}MB`);
    }
    return this.documentsService.upload(vehicleId, dto.documentType, file);
  }

  @Delete(':documentId')
  @Permissions('vehicles:update')
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
  ) {
    return this.documentsService.remove(vehicleId, documentId);
  }
}
