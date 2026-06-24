import { Body, Controller, Get, Put } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UpdateProfileAccessDto } from './dto/update-profile-access.dto';
import { ProfileAccessService } from './profile-access.service';

@Controller('settings/profile-access')
export class ProfileAccessController {
  constructor(private readonly profileAccessService: ProfileAccessService) {}

  @Get()
  @Permissions('settings:read')
  getProfileAccess() {
    return this.profileAccessService.getProfileAccess();
  }

  @Put()
  @Roles(UserRole.ADMIN)
  @Permissions('settings:update')
  updateProfileAccess(@Body() dto: UpdateProfileAccessDto) {
    return this.profileAccessService.updateProfileAccess(dto);
  }
}
