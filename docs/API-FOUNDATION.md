# API — Fundação (Opção A)

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/v1/health` | Público | Health check + DB |
| POST | `/api/v1/auth/login` | Público | Login |
| POST | `/api/v1/auth/refresh` | Público | Renovar tokens |
| POST | `/api/v1/auth/logout` | JWT | Revogar refresh token |
| POST | `/api/v1/auth/logout-all` | JWT | Revogar todas sessões |
| GET | `/api/v1/auth/me` | JWT | Usuário autenticado |

## Login

**Usuário de revenda** (tenant):

```json
POST /api/v1/auth/login
{
  "email": "admin@revendademo.com.br",
  "password": "Admin@123",
  "tenantCnpj": "00000000000191"
}
```

**Moderador** (plataforma):

```json
{
  "email": "moderator@wpscar.com.br",
  "password": "Moderator@123"
}
```

## Guards globais (ordem)

1. `JwtAuthGuard` — valida Bearer token (rotas `@Public()` ignoram)
2. `TenantGuard` — garante isolamento de tenant
3. `RolesGuard` — `@Roles(UserRole.ADMIN, ...)`
4. `PermissionsGuard` — `@Permissions('vehicles:read')`

## Decorators

- `@Public()` — sem JWT
- `@SkipTenant()` — moderador / rotas sem tenant
- `@Roles(...)` — perfil
- `@Permissions(...)` — permissão granular
- `@CurrentUser()` — usuário no handler
- `@TenantId()` — tenantId do JWT

## Paginação (módulos futuros)

Query: `?page=1&limit=20&sortBy=createdAt&sortOrder=desc&search=termo`

## Credenciais demo (após seed)

| Perfil | Email | Senha | CNPJ |
|--------|-------|-------|------|
| Admin | admin@revendademo.com.br | Admin@123 | 00000000000191 |
| Gerente | gerente@revendademo.com.br | Manager@123 | 00000000000191 |
| Vendedor | vendedor@revendademo.com.br | Seller@123 | 00000000000191 |
| Moderador | moderator@wpscar.com.br | Moderator@123 | — |
