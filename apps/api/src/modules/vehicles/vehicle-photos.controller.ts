import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { VehiclePhotosService } from './vehicle-photos.service';

@Controller('vehicles/:vehicleId/photos')
export class VehiclePhotosController {
  constructor(
    private readonly photosService: VehiclePhotosService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @Permissions('vehicles:read')
  list(@Param('vehicleId', ParseUUIDPipe) vehicleId: string) {
    return this.photosService.list(vehicleId);
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
    @UploadedFile() file: Express.Multer.File,
  ) {
    const maxMb = this.config.get<number>('upload.maxFileSizeMb') ?? 10;
    if (file && file.size > maxMb * 1024 * 1024) {
      throw new BadRequestException(`Arquivo excede ${maxMb}MB`);
    }
    return this.photosService.upload(vehicleId, file);
  }

  @Patch(':photoId/primary')
  @Permissions('vehicles:update')
  setPrimary(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.photosService.setPrimary(vehicleId, photoId);
  }

  @Delete(':photoId')
  @Permissions('vehicles:update')
  remove(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ) {
    return this.photosService.remove(vehicleId, photoId);
  }
}
