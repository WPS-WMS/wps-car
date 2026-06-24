# WPS Car — Arquitetura

## Visão geral

Monorepo:

```
wps-car/
├── apps/
│   ├── api/          # NestJS + Prisma
│   └── web/          # Next.js (export estático)
├── docs/
├── docker-compose.yml
└── render.yaml
```

## Multi-tenant

**Estratégia:** banco compartilhado, schema compartilhado, isolamento por `tenantId`.

| Decisão | Motivo |
|--------|--------|
| `tenantId` em entidades de negócio | Operação simples, migrações únicas |
| Unicidade `(tenantId, placa)`, `(tenantId, documento)` | Mesma placa em revendas diferentes |
| `User.tenantId` opcional | `MODERATOR` é usuário de plataforma |
| `tenant_branches` + `branchId` | Filiais e escopo gerente/vendedor |

**Isolamento na API:**

1. JWT inclui `tenantId`, `role`, permissões
2. `TenantContext` (request-scoped)
3. Repositórios aplicam `where: { tenantId }`
4. `DataScopeService` restringe gerente/vendedor por filial

## Estrutura API (`apps/api/src`)

```
src/
├── config/
├── domain/
├── application/         # repositórios base tenant-scoped
├── infrastructure/      # prisma, tenant, mail, storage
├── modules/             # auth, sales, settings, platform, notifications…
└── common/              # guards, filters, decorators
```

**Fluxo:** Controller → Service → Repository → Prisma

## RBAC

- **Papéis:** MODERATOR, ADMIN, MANAGER, SELLER
- **Permissões:** `Permission` + `RolePermission` + override `UserPermission`
- **Gestão de perfil:** admin define itens do menu para MANAGER/SELLER (`tenant_settings.profile_access`)

## Módulos principais

| Módulo | Função |
|--------|--------|
| `auth` | JWT, login, forgot/reset password |
| `tenants` / `users` | Empresa e usuários da revenda |
| `platform` | Métricas SaaS (moderador) |
| `settings` | Catálogos, filiais, e-mails, gestão de perfil |
| `notifications` | Dispatch de e-mails tipados |
| `sales` / `financial` | Vendas e resultado por veículo |
| `reports` | PDF/Excel e relatório geral |

## Frontend

Next.js em `apps/web` — rotas `(app)` para revenda, `(moderator)` para plataforma. Ver [FRONTEND.md](./FRONTEND.md).

## Resultado financeiro

Calculado no domínio, persistido em `VehicleFinancial`. Spec: [product/FINANCIAL-RESULT.md](./product/FINANCIAL-RESULT.md)

```
Lucro bruto      = ValorVenda - ValorCompra - Custos
Comissão         = Regra vigente (congelada em Sale.commission após SOLD/COMPLETED)
Resultado líquido = ValorVenda - ValorCompra - Custos - Comissão
```

## Upload

- Local: `./uploads/{tenantId}/...` — no Render o disco é efêmero; usar S3 em produção futura.

## E-mail

- Configuração por tipo em `/settings/email-notifications`
- SMTP via `MAIL_*` / `SMTP_*` — ver [ENV.md](./ENV.md)
