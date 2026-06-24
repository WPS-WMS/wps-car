# API — Tenants & Users

## Empresa (tenant) — usuário da revenda

| Método | Rota | Permissão / Role | Descrição |
|--------|------|------------------|-----------|
| GET | `/tenants/me` | JWT + tenant | Dados da própria empresa |
| PATCH | `/tenants/me` | ADMIN | Atualiza nome, e-mail, telefone |

Campos **não editáveis** em `/tenants/me`: `status`, `plan`, `cnpj`.

## Empresas — plataforma (moderador)

Exige `@Roles(MODERATOR)`. Ver [API-PLATFORM.md](./API-PLATFORM.md).

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/tenants` | `tenants:read` |
| POST | `/tenants` | `tenants:manage` |
| GET | `/tenants/:id` | `tenants:read` |
| PATCH | `/tenants/:id` | `tenants:manage` |

## Usuários — dentro da revenda

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/users` | `users:read` | Lista (exclui MODERATOR) |
| GET | `/users/:id` | `users:read` | Detalhe |
| POST | `/users` | `users:create` | Cria usuário |
| PATCH | `/users/:id` | `users:update` | Edita usuário |
| PATCH | `/users/:id/deactivate` | `users:delete` | Inativa |
| POST | `/users/:id/reset-password` | `users:update` | Nova senha (admin) |
| PUT | `/users/:id/permissions` | `users:update` | Overrides |

| GET | `/permissions` | `users:update` | Catálogo |

**Query:** `page`, `limit`, `search`, `role`, `active`

### Criar usuário

```json
POST /users
{
  "name": "João Vendedor",
  "email": "joao@revenda.com",
  "password": "Senha@123",
  "role": "SELLER",
  "branchId": "uuid-filial-ou-null-matriz"
}
```

Perfis permitidos: `ADMIN`, `MANAGER`, `SELLER` — **não** `MODERATOR`.

Gerente e vendedor devem ter `branchId` (filial ou null = matriz).

### Comissão do vendedor (PATCH)

```json
PATCH /users/:id
{
  "commissionType": "PERCENTAGE",
  "commissionValue": 2.5
}
```

Também via UI `/configuracoes/comissao-vendedor`. Dispara e-mail `user_welcome` ao criar usuário (se tipo ativo).

## Regras

- Pelo menos um ADMIN ativo por empresa
- Inativação/reset revoga refresh tokens
- Moderador não listável nem criável por admin da revenda
