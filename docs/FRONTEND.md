# Frontend — apps/web

Next.js com **export estático** (`output: 'export'`) para Firebase Hosting.

## Estrutura de rotas

| Grupo | Exemplos | Quem acessa |
|-------|----------|-------------|
| Público | `/login`, `/esqueci-senha`, `/redefinir-senha` | Todos |
| `(app)/` | `/dashboard`, `/estoque`, `/estoque/consulta-placa`, `/compra-inteligente`, `/vendas`, `/configuracoes/*` | Usuários da revenda |
| `(moderator)/` | `/plataforma` | Só `MODERATOR` |

Guards:

- `AuthGuard` — exige JWT
- `TenantAppGuard` — bloqueia moderador nas telas da revenda
- `ModeratorGuard` — bloqueia não-moderadores em `/plataforma`

## Login

Formulário: **e-mail + senha** apenas. A API resolve a empresa pelo e-mail (único usuário por e-mail no seed demo).

Redirecionamento pós-login:

- `MODERATOR` → `/plataforma`
- Demais → `/dashboard`

## Menu lateral (sidebar)

Itens controlados por permissões JWT + **Gestão de perfil** (admin configura o que Gerente/Vendedor vê):

- Dashboard, Veículos, Estoque, Vendas
- Cadastro: Clientes, Fornecedores
- Relatórios: Geral, Comissões
- Configurações (se `settings:read`)

Admin sempre vê tudo. Ver `GET/PUT /settings/profile-access`.

## Configurações (telas)

| Rota | Função |
|------|--------|
| `/configuracoes/gestao-perfil` | Menu por perfil (admin) |
| `/configuracoes/emails` | E-mails por tipo + remetente |
| `/configuracoes/usuarios` | CRUD usuários (sem moderador) |
| `/configuracoes/lojas` | Filiais |
| `/configuracoes/comissao-vendedor` | Comissão por vendedor |

## API client

- Base: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001/api/v1`)
- Token: `Authorization: Bearer` + refresh em `/auth/refresh`
- Código: `apps/web/src/lib/api.ts`

## Build e deploy QA

```powershell
cd apps/web
# .env.production.local com NEXT_PUBLIC_API_URL do Render
npm run build   # gera out/
cd ../..
npm run deploy:qa
```

Rotas de edição usam query string (export estático):

- `/veiculos/editar?id=UUID`
- `/clientes/editar?id=UUID`
- `/fornecedores/editar?id=UUID`

## Pastas principais

```
apps/web/src/
├── app/
│   ├── (app)/           # App da revenda
│   ├── (moderator)/     # Plataforma
│   ├── login/
│   ├── esqueci-senha/
│   └── redefinir-senha/
├── components/
├── lib/
└── providers/           # AuthProvider
```
