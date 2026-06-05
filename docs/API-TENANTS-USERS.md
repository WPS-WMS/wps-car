# API — Tenants & Users

## Empresa (tenant) — usuário da revenda

| Método | Rota | Permissão / Role | Descrição |
|--------|------|------------------|-----------|
| GET | `/tenants/me` | JWT + tenant | Dados da própria empresa |
| PATCH | `/tenants/me` | ADMIN | Atualiza nome, e-mail, telefone |

Campos **não editáveis** em `/tenants/me`: `status`, `plan`, `cnpj`.

## Empresas — plataforma (moderador)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/tenants` | `tenants:read` | Lista paginada |
| POST | `/tenants` | `tenants:manage` | Cria empresa |
| GET | `/tenants/:id` | `tenants:read` | Detalhe |
| PATCH | `/tenants/:id` | `tenants:manage` | Atualiza (todos os campos) |

**Query:** `page`, `limit`, `search`, `status`, `plan`, `sortBy`, `sortOrder`

## Usuários — dentro da revenda

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/users` | `users:read` | Lista paginada |
| GET | `/users/:id` | `users:read` | Detalhe |
| POST | `/users` | `users:create` | Cria usuário |
| PATCH | `/users/:id` | `users:update` | Edita usuário |
| PATCH | `/users/:id/deactivate` | `users:delete` | Inativa + revoga sessões |
| POST | `/users/:id/reset-password` | `users:update` | Nova senha |
| PUT | `/users/:id/permissions` | `users:update` | Overrides de permissão |

| GET | `/permissions` | `users:update` | Catálogo de permissões |

**Query usuários:** `page`, `limit`, `search`, `role`, `active`

### Criar usuário

```json
POST /api/v1/users
{
  "name": "João Vendedor",
  "email": "joao@revenda.com",
  "password": "Senha@123",
  "role": "SELLER"
}
```

Perfis permitidos: `ADMIN`, `MANAGER`, `SELLER`.

### Permissões customizadas

```json
PUT /api/v1/users/{id}/permissions
{
  "permissions": [
    { "code": "vehicles:create", "granted": true },
    { "code": "reports:read", "granted": false }
  ]
}
```

## Regras de negócio

- Não é possível inativar a si mesmo.
- Deve existir pelo menos um `ADMIN` ativo por empresa.
- Inativação revoga todos os refresh tokens do usuário.
- Reset de senha também revoga sessões.
