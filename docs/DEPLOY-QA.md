# Deploy QA — Firebase + Render + Neon

Guia para subir o **WPS Car** em ambiente de homologação (QA):

| Camada | Serviço | Função |
|--------|---------|--------|
| Banco | [Neon](https://neon.tech) | PostgreSQL gerenciado |
| API | [Render](https://render.com) | NestJS (`apps/api`) |
| Frontend | [Firebase Hosting](https://firebase.google.com/docs/hosting) (Framework-aware) | Next.js (`apps/web`) |

```mermaid
flowchart LR
  User[Usuário] --> Firebase[Firebase Hosting\nNext.js]
  Firebase -->|HTTPS API| Render[Render Web Service\nNestJS]
  Render --> Neon[(Neon PostgreSQL)]
```

---

## 1. Neon — banco QA

1. Crie um projeto no Neon (ex.: `wps-car-qa`).
2. Crie um branch `qa` ou use `main` dedicado só a homologação.
3. Em **Connection details**, copie a URL **pooled** (recomendado para Render):
   ```
   postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/neondb?sslmode=require
   ```
4. Guarde como `DATABASE_URL` (não commitar).

**Migrações e seed (uma vez, da sua máquina):**

```powershell
cd apps/api
$env:DATABASE_URL="postgresql://..."   # URL do Neon
npx prisma migrate deploy
npm run db:seed
```

O Render também roda `prisma migrate deploy` no `startCommand` a cada deploy.

---

## 2. Render — API QA

### Opção A — Blueprint (`render.yaml` na raiz)

1. No [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Conecte o repositório GitHub/GitLab.
3. O arquivo `render.yaml` cria o serviço `wps-car-api-qa` em `apps/api`.

### Opção B — Web Service manual

| Campo | Valor |
|-------|--------|
| Root Directory | `apps/api` |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npx prisma migrate deploy && npm run start:prod` |
| Health Check Path | `/api/v1/health` |

### Variáveis de ambiente (obrigatórias)

| Variável | Exemplo / nota |
|----------|----------------|
| `DATABASE_URL` | URL Neon com `?sslmode=require` |
| `JWT_ACCESS_SECRET` | Mín. 32 caracteres aleatórios |
| `JWT_REFRESH_SECRET` | Mín. 32 caracteres aleatórios |
| `CORS_ORIGIN` | URLs do Firebase, **separadas por vírgula** |
| `NODE_ENV` | `production` |

Opcionais (já têm default): `API_PREFIX`, `JWT_*_EXPIRES_IN`, `UPLOAD_DIR`, `MAX_FILE_SIZE_MB`.

**`CORS_ORIGIN` (exemplo após publicar o Firebase):**

```
https://wps-car-qa.web.app,https://wps-car-qa.firebaseapp.com
```

Render define `PORT` automaticamente; não é necessário configurá-lo.

### URL da API

Após o deploy: `https://wps-car-api-qa.onrender.com`  
Health: `https://wps-car-api-qa.onrender.com/api/v1/health`

> **Uploads:** arquivos em `UPLOAD_DIR` ficam no disco efêmero do Render. Em QA, fotos/comprovantes podem sumir após redeploy. Para QA estável, planeje S3 ou disco persistente depois.

> **Plano free:** o serviço “dorme” após inatividade; o primeiro acesso pode demorar ~30–60s.

---

## 3. Firebase — frontend QA

O projeto usa **Firebase Hosting com suporte a frameworks** (Next.js 15).

### Pré-requisitos

- Node.js 20+
- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- Login: `firebase login`

### Configurar projeto

```powershell
# Na raiz do repositório
Copy-Item .firebaserc.example .firebaserc
# Edite .firebaserc e coloque o project ID do Firebase Console
```

No [Firebase Console](https://console.firebase.google.com):

1. **Add project** → ex. `wps-car-qa`
2. Ative **Hosting** (e **App Hosting** / Frameworks se o assistente pedir)

### Variável da API no build

O Next.js embute `NEXT_PUBLIC_*` no build. Configure antes do deploy:

**Opção 1 — arquivo local (não commitar):**

```powershell
cd apps/web
Copy-Item .env.qa.example .env.production.local
# Edite: NEXT_PUBLIC_API_URL=https://SUA-API.onrender.com/api/v1
```

**Opção 2 — Firebase (recomendado para CI):**

No Console → Hosting → seu site → variáveis de ambiente do framework, ou via:

```powershell
firebase hosting:secrets:set NEXT_PUBLIC_API_URL
```

(Consulte a documentação atual do Firebase Frameworks para o fluxo exato do seu projeto.)

### Deploy

```powershell
# Raiz do repo
firebase deploy --only hosting
```

URLs típicas:

- `https://SEU-PROJECT-ID.web.app`
- `https://SEU-PROJECT-ID.firebaseapp.com`

### Atualizar CORS no Render

Copie as duas URLs acima para `CORS_ORIGIN` no Render e faça **Manual Deploy** ou aguarde o próximo deploy.

### Imagens (`/uploads`)

O `next.config.ts` já libera imagens do host da API definido em `NEXT_PUBLIC_API_URL`. Use sempre HTTPS na URL do Render em QA.

---

## 4. Checklist pós-deploy

- [ ] `GET https://...onrender.com/api/v1/health` → `ok`
- [ ] Login no Firebase URL com usuário do seed (`admin@revendademo.com.br` / `Admin@123`, CNPJ `00000000000191`)
- [ ] Sem erro de CORS no DevTools (Network)
- [ ] Cookies/tokens: API e front em domínios diferentes — o app usa Bearer no `Authorization` (já compatível)

---

## 5. Ambientes e secrets

| Onde | O que guardar |
|------|----------------|
| Neon | `DATABASE_URL` |
| Render | `DATABASE_URL`, JWT secrets, `CORS_ORIGIN` |
| Firebase / build | `NEXT_PUBLIC_API_URL` |
| Repositório | Apenas `*.example` — nunca secrets reais |

Arquivos de referência:

- `apps/api/.env.qa.example`
- `apps/web/.env.qa.example`
- `render.yaml`
- `firebase.json`
- `.firebaserc.example`

---

## 6. Fluxo de atualização (CI opcional)

1. Push na branch `qa` (ou `main`).
2. Render: auto-deploy da API (se conectado ao Git).
3. Firebase: `firebase deploy --only hosting` (local ou GitHub Action).

Exemplo de ordem em release:

1. Migrar banco (`migrate deploy` — automático no Render).
2. Deploy API.
3. Atualizar `NEXT_PUBLIC_API_URL` se a URL mudou.
4. Deploy frontend.

---

## 7. Problemas comuns

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| CORS blocked | `CORS_ORIGIN` sem URL do Firebase | Adicionar `.web.app` e `.firebaseapp.com` |
| 502 / timeout API | Render free dormindo | Aguardar ou upgrade de plano |
| Prisma P1001 | `DATABASE_URL` errada / Neon pausado | Verificar URL pooled + SSL |
| Login 401 | Seed não rodou no Neon | `npm run db:seed` com `DATABASE_URL` do Neon |
| Fotos quebradas | Upload efêmero no Render | Esperado em QA; usar S3 depois |

---

## 8. Produção

Para produção, repita o mesmo desenho com projetos separados (Neon branch `prod`, Render `wps-car-api-prod`, Firebase `wps-car-prod`) e secrets distintos. Não reutilize JWT secrets entre QA e produção.
