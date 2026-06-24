# Onboarding — WPS Car

Guia de entrada para novos colaboradores. Leia este arquivo primeiro.

## O que é o projeto

SaaS **multi-tenant** para revendas de veículos: estoque, vendas, financeiro, comissões, relatórios e configurações por empresa.

| Camada | Pasta | Stack |
|--------|-------|-------|
| API | `apps/api` | NestJS, Prisma, PostgreSQL |
| Web | `apps/web` | Next.js (export estático), Tailwind |
| Docs | `docs/` | Referência técnica e API |

## Pré-requisitos

- Node.js 20+
- PostgreSQL 16 **ou** Docker (via `docker-compose.yml` na raiz)
- npm

## Subir localmente (rápido)

### 1. Banco

**Docker (recomendado):**

```powershell
# Na raiz do repositório
Copy-Item .env.example .env
docker compose up -d
```

**PostgreSQL instalado:** crie o banco `wps_car` e use a URL em `apps/api/.env.local`.

### 2. API

```powershell
cd apps\api
Copy-Item .env.local.example .env.local
npm install
npx prisma generate
npm run prisma:migrate:deploy
npm run db:seed
npm run start:dev
```

Health: `http://localhost:3001/api/v1/health`

### 3. Web

```powershell
cd apps\web
# Opcional: Copy-Item .env.local.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

> O web usa `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1` por padrão se não houver `.env.local`.

## Login demo (após seed)

Login na web: **somente e-mail + senha** (CNPJ não é pedido na tela).

| Perfil | E-mail | Senha | Destino após login |
|--------|--------|-------|---------------------|
| Admin Alpha | admin@revendademo.com.br | Admin@123 | `/dashboard` |
| Gerente Alpha | gerente@revendademo.com.br | Manager@123 | `/dashboard` |
| Vendedor Alpha | vendedor@revendademo.com.br | Seller@123 | `/dashboard` |
| Admin Beta | admin@revendabeta.com.br | Admin@123 | `/dashboard` |
| Moderador | moderator@wpscar.com.br | Moderator@123 | `/plataforma` |

Empresa Alpha CNPJ: `00000000000191` · Beta: `11222333000181` (referência; login resolve pelo e-mail).

## Ordem de leitura da documentação

| Prioridade | Documento | Quando |
|------------|-----------|--------|
| 1 | [ENV.md](./ENV.md) | Variáveis local/QA/prod, SMTP |
| 2 | [ARCHITECTURE.md](./ARCHITECTURE.md) | Visão técnica multi-tenant |
| 3 | [FRONTEND.md](./FRONTEND.md) | Rotas, guards, build |
| 4 | [DATABASE.md](./DATABASE.md) | Schema e migrations |
| 5 | [API-FOUNDATION.md](./API-FOUNDATION.md) | Auth, guards, credenciais |
| 6 | Demais `API-*.md` | Conforme a área em que for trabalhar |

**Opcional (QA / DevOps):** [DEPLOY-QA.md](./DEPLOY-QA.md), [MULTI-TENANT-TEST.md](./MULTI-TENANT-TEST.md)

**Specs de produto (domínio):** [product/](./product/)

## Funcionalidades recentes (não esquecer)

- **Moderador:** tela `/plataforma`, métricas SaaS — [API-PLATFORM.md](./API-PLATFORM.md)
- **Gestão de perfil:** menu lateral Gerente/Vendedor — `GET/PUT /settings/profile-access`
- **E-mails por tipo:** configuração + envio SMTP — [API-SETTINGS.md](./API-SETTINGS.md)
- **Recuperação de senha:** `/esqueci-senha`, `POST /auth/forgot-password`
- **Filiais e escopo:** `tenant_branches`, `branchId` em usuários e veículos

## Comandos úteis (raiz)

```powershell
npm run dev:api      # API com .env.local
npm run dev:web      # Next.js
npm run deploy:qa    # Firebase Hosting QA
```

## Onde pedir ajuda

- Problema de ambiente → [ENV.md](./ENV.md)
- Deploy QA → [DEPLOY-QA.md](./DEPLOY-QA.md)
- Importação CSV → [IMPORT-VEHICLES.md](./IMPORT-VEHICLES.md)
