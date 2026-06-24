# API — Plataforma (moderador)

Usuário **MODERATOR** (`tenantId` nulo) administra o SaaS. Não acessa telas da revenda.

## Credenciais demo

| E-mail | Senha |
|--------|-------|
| moderator@wpscar.com.br | Moderator@123 |

Web: `/plataforma` após login.

## Métricas SaaS

| Método | Rota | Role | Permissão |
|--------|------|------|-----------|
| GET | `/platform/metrics` | MODERATOR | `platform:metrics` |

Retorna uso por empresa (usuários, filiais, estoque, vendas/receita do mês) e totais consolidados.

## Empresas (tenants)

Todas exigem `@Roles(MODERATOR)` além da permissão:

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/tenants` | `tenants:read` |
| POST | `/tenants` | `tenants:manage` |
| GET | `/tenants/:id` | `tenants:read` |
| PATCH | `/tenants/:id` | `tenants:manage` |

`POST /tenants` cria a empresa, mas **não** cria admin nem catálogos — use seed ou criação manual de usuários.

## Isolamento

- Administradores de revenda **não** acessam `/platform/metrics` nem CRUD global de tenants.
- Usuários `MODERATOR` não aparecem na listagem de usuários da revenda.
