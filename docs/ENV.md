# Variáveis de ambiente

Dois perfis principais: **local** (Postgres na máquina) e **QA** (Neon + Render + Firebase). O código não muda — só o arquivo de secrets carregado.

## Arquivos (nunca commitados)

| Arquivo | Uso |
|---------|-----|
| `apps/api/.env.local` | Dev local (`ENV_PROFILE=local`) |
| `apps/api/.env.qa` | Neon QA / testes contra QA |
| `apps/web/.env.local` | `npm run dev` → API localhost |
| `apps/web/.env.production.local` | `npm run deploy:qa` → API Render |

Copie dos exemplos:

```powershell
cd apps\api
Copy-Item .env.local.example .env.local
Copy-Item .env.qa.example .env.qa

cd ..\web
Copy-Item .env.local.example .env.local
Copy-Item .env.production.local.example .env.production.local
```

A API escolhe o arquivo via `ENV_PROFILE` (`local` ou `qa`) — ver `apps/api/src/config/resolve-env-files.ts`.

---

## API — variáveis principais

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DATABASE_URL` | Sim | Postgres (Neon: URL **pooled**) |
| `DIRECT_DATABASE_URL` | Sim | Conexão direct (Neon: sem `-pooler`) — migrations |
| `JWT_ACCESS_SECRET` | Sim | Mín. 32 caracteres |
| `JWT_REFRESH_SECRET` | Sim | Mín. 32 caracteres |
| `CORS_ORIGIN` | Não | Default `http://localhost:3000`; QA: URLs Firebase separadas por vírgula |
| `WEB_APP_URL` | Não | Default `http://localhost:3000` — links de recuperação de senha |
| `MAIL_ENABLED` | Não | `true` para enviar e-mails; `false` loga no console |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Se mail ativo | Provedor SMTP |
| `SMTP_SECURE` | Não | `true` para porta 465 |
| `MAIL_FROM` | Não | Remetente padrão |
| `PASSWORD_RESET_EXPIRES_MINUTES` | Não | Default `60` |
| `FIPE_LOOKUP_PROVIDER` | Não | `mock` (padrão) ou `http` — compra inteligente |
| `FIPE_LOOKUP_HTTP_URL` | Se `http` | URL com `{plate}` para API externa de placa/FIPE |
| `FIPE_LOOKUP_HTTP_TIMEOUT_MS` | Não | Default `8000` |
| `MARKET_LISTINGS_PROVIDER` | Não | `mock` (padrão) ou `http` — precificação inteligente (portais) |
| `MARKET_LISTINGS_HTTP_URL` | Se `http` | URL única do agregador com `{brand}`, `{model}`, `{year}`, `{mileage}`, `{fipeValue}` |
| `MARKET_LISTINGS_HTTP_URLS` | Se `http` | JSON ou `Nome\|URL,Nome2\|URL2` — consulta WebMotors/OLX/iCarros em paralelo |
| `MARKET_LISTINGS_HTTP_HEADERS` | Não | JSON de headers (ex.: `Authorization`) |
| `MARKET_LISTINGS_HTTP_API_KEY` | Não | Atalho para header `X-Api-Key` |
| `MARKET_LISTINGS_HTTP_TIMEOUT_MS` | Não | Default `8000` (por portal) |
| `MARKET_LISTINGS_HTTP_MIN_SUCCESS` | Não | Mínimo de portais com sucesso (default `1`) |
| `REDIS_URL` | Não | URL Redis para cache distribuído (permissões/JWT). Sem valor = cache in-memory por instância |

Ver `apps/api/.env.local.example` e `.env.example`. Doc: [API-PURCHASE-INTELLIGENCE.md](./API-PURCHASE-INTELLIGENCE.md) · [API-PRICING-INTELLIGENCE.md](./API-PRICING-INTELLIGENCE.md).

### Exportação assíncrona de relatórios

Relatórios PDF/Excel usam `POST /reports/exports` com polling em `GET /reports/exports/:id` e download em `GET /reports/exports/:id/download`. Com `REDIS_URL` configurado, jobs rodam na fila **BullMQ** (retry automático, concurrency 2). Sem Redis, processamento inline na API.

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `EXPORT_RETENTION_DAYS` | Não | Dias para manter arquivos/jobs de export concluídos ou falhos (padrão `7`). Limpeza automática a cada 24h |

### Performance em escala

| Recurso | Descrição |
|---------|-----------|
| Thumbnails | Upload de fotos gera WebP ~480px (`sharp`); listagens usam `thumbnailUrl` |
| pg_trgm | Índices GIN em veículos, clientes, fornecedores e observações de vendas |
| Métricas plataforma | Cache Redis/in-memory 10 min por mês (`cachedAt` na resposta) |

### Camada extra de segurança

| Recurso | Descrição |
|---------|-----------|
| Audit log | Tabela `audit_logs` — login, logout, reset de senha, permissões, exclusão de veículo, venda criada |
| 2FA (TOTP) | Admin e moderador — `POST /auth/2fa/*` + passo extra no login |
| Token rotation | `token_version` invalida access tokens; `family_id` detecta reuso de refresh |
| Upload seguro | Validação por magic bytes (conteúdo real do arquivo), não só MIME declarado |

Consulta de auditoria: `GET /audit-logs` (ADMIN vê só o tenant; MODERATOR vê todos).

---

## Web

| Variável | Default | Descrição |
|----------|---------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api/v1` | Base da API |

---

## Fluxo local

```powershell
# Terminal 1
cd apps\api
npm run start:dev

# Terminal 2
cd apps\web
npm run dev
```

Seed e import demo:

```powershell
cd apps\api
npm run db:seed
npm run import:vehicles:demo
```

---

## Fluxo QA (da sua máquina)

```powershell
cd apps\api
npm run prisma:migrate:deploy:qa
npm run db:seed:qa
npm run start:dev:qa
npm run import:vehicles:demo:qa
```

Import contra API Render: defina `IMPORT_API_URL` em `.env.qa` (URL do Render + `/api/v1`) e use o mesmo script `import:vehicles:demo:qa`.

Deploy web:

```powershell
# apps/web/.env.production.local com NEXT_PUBLIC_API_URL do Render
npm run deploy:qa
```

---

## Comandos npm (API)

| Comando | Perfil | Descrição |
|---------|--------|-----------|
| `npm run start:dev` | local | `.env.local` |
| `npm run start:dev:qa` | qa | `.env.qa` |
| `npm run prisma:migrate:deploy` | local | Migrate local |
| `npm run prisma:migrate:deploy:qa` | qa | Migrate Neon |
| `npm run db:seed` | local | Seed Alpha + Beta |
| `npm run db:seed:qa` | qa | Seed no Neon |
| `npm run import:vehicles:demo` | local | CSV demo |
| `npm run import:vehicles:demo:qa` | qa | CSV demo (API local ou Render via `IMPORT_API_URL`) |

---

## Render (servidor)

Variáveis **somente no painel Render** (`DATABASE_URL`, `DIRECT_DATABASE_URL`, JWT, `CORS_ORIGIN`, `WEB_APP_URL`, SMTP…). Não use `.env.qa` no servidor.

---

## E-mail em desenvolvimento

Com `MAIL_ENABLED=false`, a API **não envia** e-mails — o conteúdo aparece no log. Útil para testar recuperação de senha sem SMTP.

---

## Dica

Mantenha **Postgres local** e **Neon QA** separados. Assim testes locais não apagam dados de homologação.
