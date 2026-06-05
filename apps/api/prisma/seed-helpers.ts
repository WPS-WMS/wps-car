import {
  CommissionRuleType,
  PrismaClient,
  SubscriptionPlan,
  TenantStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

export const prisma = new PrismaClient();

export type DemoUserSpec = {
  email: string;
  name: string;
  role: UserRole;
  password: string;
};

export type DemoTenantSpec = {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  status?: TenantStatus;
  plan?: SubscriptionPlan;
  users: DemoUserSpec[];
  branches?: { name: string; address?: string; phone?: string }[];
  defaultCommissionPercent?: number;
};

export const DEMO_TENANT_ALPHA: DemoTenantSpec = {
  name: 'Revenda Demo WPS',
  cnpj: '00000000000191',
  email: 'contato@revendademo.com.br',
  phone: '11999999999',
  status: 'ACTIVE',
  plan: 'PROFESSIONAL',
  users: [
    { email: 'admin@revendademo.com.br', name: 'Administrador Demo', role: 'ADMIN', password: 'Admin@123' },
    { email: 'gerente@revendademo.com.br', name: 'Gerente Demo', role: 'MANAGER', password: 'Manager@123' },
    { email: 'vendedor@revendademo.com.br', name: 'Vendedor Demo', role: 'SELLER', password: 'Seller@123' },
  ],
  branches: [
    { name: 'Filial Centro', address: 'Av. Paulista, 1000 — São Paulo/SP' },
    { name: 'Filial ABC', address: 'Rua das Flores, 50 — Santo André/SP' },
  ],
  defaultCommissionPercent: 2,
};

export const DEMO_TENANT_BETA: DemoTenantSpec = {
  name: 'Revenda Beta WPS',
  cnpj: '11222333000181',
  email: 'contato@revendabeta.com.br',
  phone: '11988887777',
  status: 'ACTIVE',
  plan: 'STARTER',
  users: [
    { email: 'admin@revendabeta.com.br', name: 'Administrador Beta', role: 'ADMIN', password: 'Admin@123' },
    { email: 'gerente@revendabeta.com.br', name: 'Gerente Beta', role: 'MANAGER', password: 'Manager@123' },
    { email: 'vendedor@revendabeta.com.br', name: 'Vendedor Beta', role: 'SELLER', password: 'Seller@123' },
  ],
  branches: [
    { name: 'Filial Campinas', address: 'Av. Brasil, 200 — Campinas/SP' },
    { name: 'Filial Santos', address: 'Rua do Comércio, 15 — Santos/SP' },
  ],
  defaultCommissionPercent: 3,
};

export async function seedTenantConfiguration(tenantId: string) {
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

async function seedTenantBranches(
  tenantId: string,
  branches: NonNullable<DemoTenantSpec['branches']>,
) {
  for (const [index, branch] of branches.entries()) {
    const existing = await prisma.tenantBranch.findFirst({
      where: { tenantId, name: branch.name },
    });
    if (existing) continue;

    await prisma.tenantBranch.create({
      data: {
        tenantId,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        sortOrder: index,
        active: true,
      },
    });
  }
}

export async function seedDemoTenant(spec: DemoTenantSpec) {
  const tenant = await prisma.tenant.upsert({
    where: { cnpj: spec.cnpj },
    update: {
      name: spec.name,
      email: spec.email,
      phone: spec.phone,
    },
    create: {
      name: spec.name,
      cnpj: spec.cnpj,
      email: spec.email,
      phone: spec.phone,
      status: spec.status ?? 'ACTIVE',
      plan: spec.plan ?? 'STARTER',
    },
  });

  for (const user of spec.users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: user.email } },
      update: { passwordHash, active: true, name: user.name, role: user.role },
      create: {
        tenantId: tenant.id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
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
        value: spec.defaultCommissionPercent ?? 2,
        active: true,
        isDefault: true,
      },
    });
  }

  await seedTenantConfiguration(tenant.id);

  if (spec.branches?.length) {
    await seedTenantBranches(tenant.id, spec.branches);
  }

  return tenant;
}

export function printTenantCredentials(spec: DemoTenantSpec) {
  console.log(`--- ${spec.name} (CNPJ: ${spec.cnpj}) ---`);
  for (const user of spec.users) {
    console.log(`${user.role.padEnd(8)} ${user.email} / ${user.password}`);
  }
  if (spec.branches?.length) {
    console.log(`Filiais: ${spec.branches.map((b) => b.name).join(', ')}`);
  }
}
