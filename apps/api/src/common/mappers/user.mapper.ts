import { User, UserPermission } from '@prisma/client';

type UserWithPermissions = User & {
  branch?: { id: string; name: string } | null;
  rolePermissions?: (UserPermission & {
    permission: { code: string };
  })[];
};

export function toUserResponse(user: UserWithPermissions) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: (user as any).phone ?? null,
    address: (user as any).address ?? null,
    branchId: user.branchId ?? null,
    branchName: user.branch?.name ?? null,
    active: user.active,
    deactivatedAt: (user as any).deactivatedAt ?? null,
    deactivationReason: (user as any).deactivationReason ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    createdById: user.createdById,
    updatedById: user.updatedById,
    permissionOverrides: user.rolePermissions?.map((up) => ({
      code: up.permission.code,
      granted: up.granted,
    })),
  };
}
