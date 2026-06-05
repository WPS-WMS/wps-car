import type { AuthUser } from '@/types/api';

export function hasPermission(user: AuthUser | null, code: string): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'MODERATOR') return true;
  return user.permissions.includes(code);
}
