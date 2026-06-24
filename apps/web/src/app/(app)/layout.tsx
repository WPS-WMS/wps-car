import { AuthGuard } from '@/components/auth-guard';
import { TenantAppGuard } from '@/components/auth/tenant-app-guard';
import { AppShell } from '@/components/layout/app-shell';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <TenantAppGuard>
        <AppShell>{children}</AppShell>
      </TenantAppGuard>
    </AuthGuard>
  );
}
