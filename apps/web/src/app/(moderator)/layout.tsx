import { AuthGuard } from '@/components/auth-guard';
import { ModeratorGuard } from '@/components/auth/moderator-guard';
import { ModeratorShell } from '@/components/layout/moderator-shell';

export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <ModeratorGuard>
        <ModeratorShell>{children}</ModeratorShell>
      </ModeratorGuard>
    </AuthGuard>
  );
}
