# WPS Car

SaaS multi-tenant para gestão de revendas de veículos.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js, TypeScript, Tailwind |
| Backend | NestJS, Prisma |
| Banco | PostgreSQL |
| Infra local | Docker Compose |
| QA | Neon + Render + Firebase Hosting |

## Comece aqui

**Novos colaboradores:** [docs/ONBOARDING.md](docs/ONBOARDING.md)

Ambientes e secrets: [docs/ENV.md](docs/ENV.md) · Deploy QA: [docs/DEPLOY-QA.md](docs/DEPLOY-QA.md)

## Subir localmente

```powershell
# 1. Postgres (Docker)
Copy-Item .env.example .env
docker compose up -d

# 2. API
cd apps\api
Copy-Item .env.local.example .env.local
npm install
npx prisma generate
npm run prisma:migrate:deploy
npm run db:seed
npm run start:dev

# 3. Web (outro terminal)
cd apps\web
npm install
npm run dev
```

- API: `http://localhost:3001/api/v1/health`
- Web: `http://localhost:3000`
- Login demo: `admin@revendademo.com.br` / `Admin@123` (somente e-mail e senha)

## Documentação

### Entrada e infra

- [Onboarding](docs/ONBOARDING.md)
- [Variáveis de ambiente](docs/ENV.md)
- [Arquitetura](docs/ARCHITECTURE.md)
- [Frontend](docs/FRONTEND.md)
- [Banco de dados](docs/DATABASE.md)
- [Deploy QA](docs/DEPLOY-QA.md)

### API

- [Fundação (auth)](docs/API-FOUNDATION.md)
- [Plataforma / moderador](docs/API-PLATFORM.md)
- [Tenants & Users](docs/API-TENANTS-USERS.md)
- [Veículos & Estoque](docs/API-VEHICLES-STOCK.md)
- [Clientes & Fornecedores](docs/API-CUSTOMERS-SUPPLIERS.md)
- [Financeiro & Custos](docs/API-FINANCIAL-COSTS.md)
- [Vendas & Comissões](docs/API-SALES-COMMISSIONS.md)
- [Configurações](docs/API-SETTINGS.md)
- [Dashboards](docs/API-DASHBOARDS.md)
- [Relatórios](docs/API-REPORTS.md)
- [Compra inteligente](docs/API-PURCHASE-INTELLIGENCE.md)

### Operações

- [Importação CSV de veículos](docs/IMPORT-VEHICLES.md)
- [Teste multi-tenant](docs/MULTI-TENANT-TEST.md)

### Especificações de produto

- [product/](docs/product/)

## Deploy QA

```powershell
npm run deploy:qa
```

Requer `apps/web/.env.production.local` (ver `.env.production.local.example`). Passo a passo: [docs/DEPLOY-QA.md](docs/DEPLOY-QA.md).
