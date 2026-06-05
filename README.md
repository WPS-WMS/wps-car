# WPS Car

SaaS multi-tenant para gestão de revendas de veículos.

## Stack (planejada)

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js, TypeScript, Tailwind, shadcn/ui |
| Backend | NestJS, Prisma |
| Banco | PostgreSQL |
| Infra | Docker Compose |

## Fase atual

**Fase 2 — Fundação NestJS:** auth, multi-tenant, RBAC.

**Fase 3 — Tenants & Users:** CRUD empresa (plataforma + `/me`), CRUD usuários, reset senha, permissões.

**Fase 4 — Veículos & Estoque:** CRUD veículos, fotos (upload local), listagem estoque, movimentações, busca por placa.

**Fase 5 — Clientes & Fornecedores:** CRUD, histórico, vendedor responsável, categorias de fornecedor.

**Fase 6 — Financeiro & Custos:** valores por veículo, custos, comissão e resultado automático.

**Fase 7 — Vendas & Comissões:** fluxo de venda, status, comissões e regras configuráveis.

**Fase 8 — Configurações:** catálogos, margens padrão, e-mails.

**Fase 9 — Dashboards:** gerencial, vendedor e ranking.

**Fase 10 — Frontend:** login, dashboard, estoque e vendas (`apps/web`).

**Fase 11 — Relatórios:** exportação PDF e Excel (estoque, vendas, resumo gerencial).

- Arquitetura: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- Banco de dados: [docs/DATABASE.md](docs/DATABASE.md)
- API auth/health: [docs/API-FOUNDATION.md](docs/API-FOUNDATION.md)

## Como subir localmente

**PostgreSQL no Windows (sem Docker):** [docs/SETUP-POSTGRES-WINDOWS.md](docs/SETUP-POSTGRES-WINDOWS.md)

**Com Docker:**

```powershell
# Raiz — PostgreSQL
Copy-Item .env.example .env
docker compose up -d

# API
cd apps/api
Copy-Item .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```

API: `http://localhost:3001/api/v1/health`

```powershell
# Frontend (com API rodando)
cd apps/web
Copy-Item .env.example .env.local
npm install
npm run dev
```

Web: `http://localhost:3000` — login demo: `admin@revendademo.com.br` / `Admin@123` (CNPJ `00000000000191`)

## Documentação API

- [Fundação (auth)](docs/API-FOUNDATION.md)
- [Tenants & Users](docs/API-TENANTS-USERS.md)
- [Veículos & Estoque](docs/API-VEHICLES-STOCK.md)
- [Clientes & Fornecedores](docs/API-CUSTOMERS-SUPPLIERS.md)
- [Financeiro & Custos](docs/API-FINANCIAL-COSTS.md)
- [Vendas & Comissões](docs/API-SALES-COMMISSIONS.md)
- [Configurações](docs/API-SETTINGS.md)
- [Dashboards](docs/API-DASHBOARDS.md)
- [Relatórios](docs/API-REPORTS.md)
- [Importação em lote de veículos (CSV)](docs/IMPORT-VEHICLES.md)
- [Relatório geral (funcional)](docs/GENERAL-REPORT.md)
- [Resultado financeiro por veículo (funcional)](docs/FINANCIAL-RESULT.md)

## Ambiente QA (Firebase + Render + Neon)

Passo a passo completo: [docs/DEPLOY-QA.md](docs/DEPLOY-QA.md)

Arquivos na raiz: `render.yaml`, `firebase.json`, `.firebaserc.example`.

## Próximo passo

Evoluções opcionais: mais tipos de relatório, filtros avançados, agendamento por e-mail.
