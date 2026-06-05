import { Badge } from '@/components/ui/badge';

export function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'ADMIN':
      return <Badge className="bg-violet-100 text-violet-900">Administrador</Badge>;
    case 'MANAGER':
      return <Badge className="bg-blue-100 text-blue-900">Gerente</Badge>;
    case 'SELLER':
      return <Badge variant="secondary">Vendedor</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

export function StatusBadge({ active }: { active: boolean | undefined }) {
  if (active === false) {
    return <Badge className="bg-rose-100 text-rose-900">Inativo</Badge>;
  }
  return <Badge className="bg-emerald-100 text-emerald-900">Ativo</Badge>;
}

