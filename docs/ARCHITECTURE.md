# WPS Car — Arquitetura

## Visão geral

Monorepo preparado para escalar:

```
wps-car/
├── apps/
│   ├── api/          # NestJS + Prisma (backend)
│   └── web/          # Next.js (frontend) — próxima fase
├── docs/
├── docker-compose.yml
└── .env.example
```

## Multi-tenant

**Estratégia:** banco compartilhado, schema compartilhado, isolamento por `tenantId`.

| Decisão | Motivo |
|--------|--------|
| `tenantId` em todas as entidades de negócio | Simples de operar, migrações únicas, custo baixo |
| Unicidade composta `(tenantId, placa)`, `(tenantId, documento)` | Mesma placa pode existir em revendas diferentes |
| `User.tenantId` opcional | `MODERATOR` é usuário de plataforma (sem tenant) |
| Índices em `tenantId` + filtros frequentes | Performance em listagens paginadas |

**Isolamento na aplicação (fase API):**

1. JWT inclui `tenantId` e `role`
2. `TenantContext` (request-scoped) injetado por guard
3. Repositórios **sempre** aplicam `where: { tenantId }`
4. Prisma middleware como segunda linha de defesa (opcional)

## Clean Architecture (NestJS)

```
apps/api/src/
├── domain/           # Entidades, value objects, regras puras
├── application/      # Use cases, DTOs, interfaces de repositório
├── infrastructure/   # Prisma, storage, FIPE externo
└── presentation/     # Controllers, guards, filters, pipes
```

**Fluxo:** Controller → Service/UseCase → Repository → Prisma

## RBAC

- **Papel base** (`UserRole`): MODERATOR, ADMIN, MANAGER, SELLER
- **Permissões granulares** (`Permission` + `RolePermission`): ex. `vehicles:create`
- **Override** (`UserPermission`): exceções por usuário

## Resultado financeiro (domínio)

Calculado no **service de domínio**, persistido em `VehicleFinancial`.

Documento funcional completo (critérios de aceite e regras de negócio): [FINANCIAL-RESULT.md](./FINANCIAL-RESULT.md)

```
Total de custos  = Soma dos custos vinculados
Lucro bruto      = ValorVenda - ValorCompra - Custos
Margem R$        = ValorVenda - ValorCompra - Custos
Comissão         = Regra vigente (congelada após venda SOLD/COMPLETED)
Resultado líquido = ValorVenda - ValorCompra - Custos - Comissão
Margem %         = (Resultado líquido / ValorVenda) × 100  (quando venda > 0)
Dias em estoque  = data_venda - data_compra (ou hoje - compra se em estoque)
```

**Comissão congelada:** ao finalizar a venda, o valor é gravado em `Sale.commission` e não muda quando regras do vendedor/revenda forem alteradas posteriormente.

Compra inteligente:

```
ValorSugeridoCompra = ValorFIPE - MargemDesejada - CustosEstimados
```

## Upload

- `AttachmentStorageProvider`: LOCAL | S3
- Paths por tenant: `uploads/{tenantId}/{entityType}/{id}/`
- Interface `StorageService` para trocar implementação sem alterar domínio

## Estrutura API (`apps/api/src`)

```
src/
├── config/              # env validation
├── domain/              # exceções de domínio
├── application/         # repositórios base (tenant-scoped)
├── infrastructure/      # prisma, tenant context
├── modules/             # auth, health, …
├── common/              # guards, filters, decorators, DTOs
├── app.module.ts
└── main.ts
```

## Roadmap de módulos

1. ✅ Modelagem Prisma + Docker
2. ✅ NestJS base (auth JWT, tenant guard, RBAC, error filter, logger)
3. ✅ Módulo Tenant + Users
4. ✅ Módulo Veículos + Estoque
5. ✅ Clientes / Fornecedores
6. ✅ Financeiro + Custos + Resultado
7. ✅ Vendas + Comissões
8. ✅ Configurações
9. ✅ Dashboards (relatórios detalhados em fase futura)
10. ⬜ Compra inteligente (FIPE)
11. ⬜ Frontend Next.js
12. ⬜ Testes
