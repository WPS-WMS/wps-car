import { UserRole } from '@prisma/client';

export class AuthUserResponseDto {
  id!: string;
  name!: string;
  email!: string;
  role!: UserRole;
  tenantId!: string | null;
  branchId!: string | null;
  permissions!: string[];
}

export class LoginResponseDto {
  accessToken!: string;
  refreshToken!: string;
  expiresIn!: string;
  user!: AuthUserResponseDto;
}
