import type { AuthUser } from '@/types/api';

export function hasPermission(user: AuthUser | null, code: string): boolean {
  if (!user) return false;
  if (user.role === 'MODERATOR') return false;
  if (user.role === 'ADMIN') return true;
  return user.permissions.includes(code);
}
