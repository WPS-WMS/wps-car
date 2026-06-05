import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  DEMO_TENANT_ALPHA,
  DEMO_TENANT_BETA,
  prisma,
  printTenantCredentials,
  seedDemoTenant,
} from './seed-helpers';

const PERMISSIONS: { code: string; module: string; description: string }[] = [
  { code: 'platform:metrics', module: 'platform', description: 'Métricas globais SaaS' },
  { code: 'tenants:read', module: 'tenants', description: 'Visualizar empresas' },
  { code: 'tenants:manage', module: 'tenants', description: 'Gerenciar empresas' },
  { code: 'users:read', module: 'users', description: 'Listar usuários' },
  { code: 'users:create', module: 'users', description: 'Criar usuários' },
  { code: 'users:update', module: 'users', description: 'Editar usuários' },
  { code: 'users:delete', module: 'users', description: 'Inativar/excluir usuários' },
  { code: 'vehicles:read', module: 'vehicles', description: 'Consultar veículos' },
  { code: 'vehicles:create', module: 'vehicles', description: 'Cadastrar veículos' },
  { code: 'vehicles:update', module: 'vehicles', description: 'Editar veículos' },
  { code: 'vehicles:delete', module: 'vehicles', description: 'Excluir veículos' },
  { code: 'stock:read', module: 'stock', description: 'Consultar estoque' },
  { code: 'stock:move', module: 'stock', description: 'Movimentar estoque' },
  { code: 'customers:read', module: 'customers', description: 'Consultar clientes' },
  { code: 'customers:create', module: 'customers', description: 'Cadastrar clientes' },
  { code: 'customers:update', module: 'customers', description: 'Editar clientes' },
  { code: 'suppliers:read', module: 'suppliers', description: 'Consultar fornecedores' },
  { code: 'suppliers:create', module: 'suppliers', description: 'Cadastrar fornecedores' },
  { code: 'suppliers:update', module: 'suppliers', description: 'Editar fornecedores' },
  { code: 'sales:read', module: 'sales', description: 'Consultar vendas' },
  { code: 'sales:create', module: 'sales', description: 'Registrar vendas' },
  { code: 'sales:update', module: 'sales', description: 'Atualizar vendas' },
  { code: 'financial:read', module: 'financial', description: 'Consultar financeiro' },
  { code: 'financial:update', module: 'financial', description: 'Editar financeiro' },
  { code: 'costs:read', module: 'costs', description: 'Consultar custos' },
  { code: 'costs:create', module: 'costs', description: 'Lançar custos' },
  { code: 'commissions:read', module: 'commissions', description: 'Consultar comissões' },
  { code: 'commissions:configure', module: 'commissions', description: 'Configurar comissões' },
  { code: 'reports:read', module: 'reports', description: 'Relatórios' },
  { code: 'dashboard:read', module: 'dashboard', description: 'Dashboards' },
  { code: 'settings:read', module: 'settings', description: 'Consultar configurações' },
  { code: 'settings:update', module: 'settings', description: 'Editar configurações' },
  { code: 'purchase-intelligence:read', module: 'purchase', description: 'Compra inteligente' },
];

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  MODERATOR: ['platform:metrics', 'tenants:read', 'tenants:manage'],
  ADMIN: PERMISSIONS.filter((p) => !p.code.startsWith('platform:')).map((p) => p.code),
  MANAGER: [
    'users:read',
    'vehicles:read', 'vehicles:create', 'vehicles:update',
    'stock:read', 'stock:move',
    'customers:read', 'customers:create', 'customers:update',
    'suppliers:read', 'suppliers:create', 'suppliers:update',
    'sales:read', 'sales:create', 'sales:update',
    'financial:read', 'financial:update',
    'costs:read', 'costs:create',
    'commissions:read',
    'reports:read',
    'dashboard:read',
    'settings:read',
    'purchase-intelligence:read',
  ],
  SELLER: [
    'vehicles:read',
    'stock:read',
    'customers:read', 'customers:create',
    'sales:read', 'sales:create', 'sales:update',
    'commissions:read',
    'reports:read',
    'dashboard:read',
    'purchase-intelligence:read',
  ],
};

async function main() {
  console.log('Seeding permissões...');

  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  for (const role of Object.values(UserRole)) {
    const codes = ROLE_PERMISSIONS[role];
    for (const code of codes) {
      const permission = allPermissions.find((p) => p.code === code);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          role_permissionId: { role, permissionId: permission.id },
        },
        update: {},
        create: { role, permissionId: permission.id },
      });
    }
  }

  console.log('Seeding empresa Alpha...');
  await seedDemoTenant(DEMO_TENANT_ALPHA);

  console.log('Seeding empresa Beta...');
  await seedDemoTenant(DEMO_TENANT_BETA);

  const modPasswordHash = await bcrypt.hash('Moderator@123', 10);
  const existingMod = await prisma.user.findFirst({
    where: { email: 'moderator@wpscar.com.br', role: UserRole.MODERATOR },
  });

  if (!existingMod) {
    await prisma.user.create({
      data: {
        tenantId: null,
        name: 'Moderador Plataforma',
        email: 'moderator@wpscar.com.br',
        passwordHash: modPasswordHash,
        role: UserRole.MODERATOR,
        active: true,
      },
    });
  }

  console.log('\nSeed concluído.\n');
  printTenantCredentials(DEMO_TENANT_ALPHA);
  console.log('');
  printTenantCredentials(DEMO_TENANT_BETA);
  console.log('\nModerador plataforma: moderator@wpscar.com.br / Moderator@123');
  console.log('\nNo login, use o CNPJ da empresa para escolher o tenant.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
