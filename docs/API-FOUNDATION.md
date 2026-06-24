# API — Fundação

Base: `/api/v1`

## Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/health` | Público | Health check + DB |
| POST | `/auth/login` | Público | Login |
| POST | `/auth/refresh` | Público | Renovar tokens |
| POST | `/auth/logout` | JWT | Revogar refresh token |
| POST | `/auth/logout-all` | JWT | Revogar todas sessões |
| GET | `/auth/me` | JWT | Usuário autenticado |
| POST | `/auth/forgot-password` | Público | Envia link de recuperação |
| POST | `/auth/reset-password` | Público | Redefine senha com token |

## Login

**Web (revenda):** somente e-mail + senha. A API encontra o usuário pelo e-mail (deve ser único no banco).

```json
POST /auth/login
{
  "email": "admin@revendademo.com.br",
  "password": "Admin@123"
}
```

**Opcional na API:** `tenantCnpj` — usado se o mesmo e-mail existir em mais de uma empresa (evitar ambiguidade).

**Moderador:**

```json
{
  "email": "moderator@wpscar.com.br",
  "password": "Moderator@123"
}
```

Redirecionamento web: moderador → `/plataforma`; demais → `/dashboard`.

## Recuperação de senha

1. `POST /auth/forgot-password` `{ "email": "..." }` — resposta genérica (não revela se e-mail existe)
2. E-mail com link `{WEB_APP_URL}/redefinir-senha?token=...`
3. `POST /auth/reset-password` `{ "token": "...", "newPassword": "..." }` — revoga sessões

Tipo de e-mail: `password_reset` (sempre enviado se SMTP/log habilitado). Ver [API-SETTINGS.md](./API-SETTINGS.md).

## Guards globais (ordem)

1. `JwtAuthGuard`
2. `TenantGuard`
3. `RolesGuard`
4. `PermissionsGuard`

## Decorators

- `@Public()` — sem JWT
- `@SkipTenant()` — moderador / rotas sem tenant
- `@Roles(...)` — perfil
- `@Permissions(...)` — permissão granular
- `@CurrentUser()` / `@TenantId()`

## Paginação

Query: `?page=1&limit=20&sortBy=createdAt&sortOrder=desc&search=termo`

## Credenciais demo (após seed)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin Alpha | admin@revendademo.com.br | Admin@123 |
| Gerente Alpha | gerente@revendademo.com.br | Manager@123 |
| Vendedor Alpha | vendedor@revendademo.com.br | Seller@123 |
| Admin Beta | admin@revendabeta.com.br | Admin@123 |
| Moderador | moderator@wpscar.com.br | Moderator@123 |

Plataforma: [API-PLATFORM.md](./API-PLATFORM.md)
