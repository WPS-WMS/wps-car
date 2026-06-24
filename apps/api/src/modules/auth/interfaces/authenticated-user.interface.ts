import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string | null;
  branchId: string | null;
  permissions: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  tenantId: string | null;
  tokenVersion?: number;
  type: 'access' | 'refresh' | '2fa_pending';
}
