import { Module } from '@nestjs/common';
import { FipeLookupService } from './fipe-lookup.service';

@Module({
  providers: [FipeLookupService],
  exports: [FipeLookupService],
})
export class FipeModule {}
