import { CommissionRuleType, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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

async function seedTenantConfiguration(tenantId: string) {
  const settings = [
    { key: 'default_margin_percent', value: 12 },
    { key: 'default_purchase_margin_percent', value: 15 },
    { key: 'estimated_prep_costs_default', value: 2000 },
  ];

  for (const s of settings) {
    await prisma.tenantSetting.upsert({
      where: { tenantId_key: { tenantId, key: s.key } },
      update: { value: s.value },
      create: { tenantId, key: s.key, value: s.value },
    });
  }

  const catalogs = {
    vehicleTypes: [
      { name: 'Carro', code: 'car', sortOrder: 1 },
      { name: 'Moto', code: 'motorcycle', sortOrder: 2 },
      { name: 'Caminhão', code: 'truck', sortOrder: 3 },
      { name: 'Produto', code: 'product', sortOrder: 4 },
    ],
    paymentMethods: [
      { name: 'PIX', code: 'pix', sortOrder: 1 },
      { name: 'Financiamento', code: 'financing', sortOrder: 2 },
      { name: 'Dinheiro', code: 'cash', sortOrder: 3 },
    ],
    costTypes: [
      { name: 'Pintura', code: 'painting', sortOrder: 1 },
      { name: 'Mecânica', code: 'mechanics', sortOrder: 2 },
      { name: 'Funilaria', code: 'bodywork', sortOrder: 3 },
      { name: 'Higienização', code: 'sanitization', sortOrder: 4 },
      { name: 'Documentação', code: 'documentation', sortOrder: 5 },
      { name: 'Despachante', code: 'dispatcher', sortOrder: 6 },
      { name: 'Transporte', code: 'transport', sortOrder: 7 },
      { name: 'Guincho', code: 'towing', sortOrder: 8 },
      { name: 'Anúncios', code: 'advertising', sortOrder: 9 },
      { name: 'Comissão', code: 'commission', sortOrder: 10 },
      { name: 'Lavagem', code: 'washing', sortOrder: 11 },
      { name: 'Revisão', code: 'revision', sortOrder: 12 },
      { name: 'Outros', code: 'other', sortOrder: 13 },
    ],
  };

  for (const item of catalogs.vehicleTypes) {
    await prisma.configVehicleType.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: {},
      create: { tenantId, ...item, active: true },
    });
  }

  for (const item of catalogs.paymentMethods) {
    await prisma.configPaymentMethod.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: {},
      create: { tenantId, ...item, active: true },
    });
  }

  for (const item of catalogs.costTypes) {
    await prisma.configCostType.upsert({
      where: { tenantId_code: { tenantId, code: item.code } },
      update: {},
      create: { tenantId, ...item, active: true },
    });
  }

  await prisma.configEmailTemplate.upsert({
    where: { tenantId_code: { tenantId, code: 'sale_completed' } },
    update: {},
    create: {
      tenantId,
      code: 'sale_completed',
      subject: 'Parabéns pela sua compra!',
      bodyHtml: '<p>Olá {{customerName}}, sua compra do veículo {{vehicleName}} foi concluída.</p>',
      active: true,
    },
  });
}

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

  console.log('Seeding tenant demo...');

  const tenant = await prisma.tenant.upsert({
    where: { cnpj: '00000000000191' },
    update: {},
    create: {
      name: 'Revenda Demo WPS',
      cnpj: '00000000000191',
      email: 'contato@revendademo.com.br',
      phone: '11999999999',
      status: 'ACTIVE',
      plan: 'PROFESSIONAL',
    },
  });

  const passwordHash = await bcrypt.hash('Admin@123', 10);

  const managerPasswordHash = await bcrypt.hash('Manager@123', 10);
  const sellerPasswordHash = await bcrypt.hash('Seller@123', 10);

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'admin@revendademo.com.br' },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Administrador Demo',
      email: 'admin@revendademo.com.br',
      passwordHash,
      role: UserRole.ADMIN,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'gerente@revendademo.com.br' },
    },
    update: { passwordHash: managerPasswordHash, active: true },
    create: {
      tenantId: tenant.id,
      name: 'Gerente Demo',
      email: 'gerente@revendademo.com.br',
      passwordHash: managerPasswordHash,
      role: UserRole.MANAGER,
      active: true,
    },
  });

  await prisma.user.upsert({
    where: {
      tenantId_email: { tenantId: tenant.id, email: 'vendedor@revendademo.com.br' },
    },
    update: { passwordHash: sellerPasswordHash, active: true },
    create: {
      tenantId: tenant.id,
      name: 'Vendedor Demo',
      email: 'vendedor@revendademo.com.br',
      passwordHash: sellerPasswordHash,
      role: UserRole.SELLER,
      active: true,
    },
  });

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

  const existingRule = await prisma.commissionRule.findFirst({
    where: { tenantId: tenant.id, isDefault: true },
  });

  if (!existingRule) {
    await prisma.commissionRule.create({
      data: {
        tenantId: tenant.id,
        name: 'Comissão padrão — % sobre venda',
        type: CommissionRuleType.SALE_PERCENTAGE,
        value: 2,
        active: true,
        isDefault: true,
      },
    });
  }

  await seedTenantConfiguration(tenant.id);

  console.log('Seed concluído.');
  console.log('--- Credenciais demo (CNPJ: 00000000000191) ---');
  console.log('Admin:    admin@revendademo.com.br / Admin@123');
  console.log('Gerente:  gerente@revendademo.com.br / Manager@123 (cadastra veículos)');
  console.log('Vendedor: vendedor@revendademo.com.br / Seller@123 (sem cadastro de veículos)');
  console.log('Moderador: moderator@wpscar.com.br / Moderator@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
