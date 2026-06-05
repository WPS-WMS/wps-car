# Testes E2E — API WPS Car

Testes automatizados de **criação de veículos e produtos** via HTTP (NestJS + Supertest).

## Pré-requisitos

1. PostgreSQL rodando com o banco configurado em `apps/api/.env`
2. Migrations e seed aplicados:

```bash
cd apps/api
npm run prisma:migrate:deploy
npm run db:seed
```

3. **API em execução** (os testes chamam a instância real, não sobem o servidor sozinhos):

```bash
cd apps/api
npm run start:dev
```

Em outro terminal:

```bash
cd apps/api
npm install
npm run test:e2e
```

Somente cadastro de veículos/produtos:

```bash
npm run test:e2e:vehicles
```

## Variáveis opcionais

| Variável | Padrão |
|----------|--------|
| `E2E_EMAIL` | `admin@revendademo.com.br` |
| `E2E_PASSWORD` | `Admin@123` |
| `E2E_TENANT_CNPJ` | `00000000000191` |
| `E2E_API_URL` | `http://127.0.0.1:3001/api/v1` |

## O que é testado

- Login com tenant
- `POST /vehicles` — tipo **CAR**
- `POST /vehicles` — tipo **PRODUCT**
- Listagem com busca
- Placa inválida → 400
- Sem token → 401
- Limpeza: exclusão dos registros criados no `afterAll`

## Teste de interface (opcional)

Para automatizar o **formulário web** (`/veiculos/novo`), use [Playwright](https://playwright.dev/) no app `apps/web` apontando para API + web em execução.
