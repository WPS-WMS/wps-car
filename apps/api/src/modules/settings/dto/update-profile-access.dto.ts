import { IsArray, IsIn, IsString } from 'class-validator';
import { PROFILE_ACCESS_ROLES } from '../constants/profile-access';

export class UpdateProfileAccessDto {
  @IsIn(PROFILE_ACCESS_ROLES)
  role!: (typeof PROFILE_ACCESS_ROLES)[number];

  @IsArray()
  @IsString({ each: true })
  enabledFeatures!: string[];
}
