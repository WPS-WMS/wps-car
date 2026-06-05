import { Module } from '@nestjs/common';
import { PermissionsCatalogController } from './permissions-catalog.controller';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './repositories/users.repository';

@Module({
  controllers: [UsersController, PermissionsCatalogController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
