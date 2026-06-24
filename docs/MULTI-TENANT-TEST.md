# Teste multi-tenant

Cada **empresa** é um registro em `tenants` (matriz). Tudo — usuários, veículos, vendas, filiais, configurações — fica isolado por `tenantId`.

## Empresas demo (após seed)

| Empresa | CNPJ | Admin (login: e-mail + senha) |
|---------|------|-------------------------------|
| Revenda Demo WPS (Alpha) | `00000000000191` | `admin@revendademo.com.br` / `Admin@123` |
| Revenda Beta WPS | `11222333000181` | `admin@revendabeta.com.br` / `Admin@123` |

Cada uma já vem com:
- Catálogos (tipos de veículo, custo, pagamento)
- Regra de comissão padrão
- **2 filiais** de exemplo
- Gerente e vendedor (senhas `Manager@123` / `Seller@123`)

## Como testar

1. Abra o site QA e faça login com o **e-mail** da tabela (sem CNPJ).
2. Cadastre veículos/vendas em uma empresa.
3. Saia e entre com o **e-mail da outra empresa** — os dados não aparecem (isolamento).

## Criar a segunda empresa no banco

### Opção A — Seed completo (Alpha + Beta)

```powershell
cd apps/api
$env:DATABASE_URL="sua-url-neon"
npm run db:seed
```

### Opção B — Só a empresa Beta

```powershell
cd apps/api
$env:DATABASE_URL="sua-url-neon"
npm run db:seed:beta
```

## Filiais

- **Matriz** = o próprio tenant (`/tenants/me`).
- **Filiais** = `tenant_branches` vinculadas ao mesmo `tenantId`.
- Cadastro: **Configurações → Filiais**.

## Estoque demo (veículos e produtos)

Após o seed e com a API rodando:

```powershell
cd apps/api
npm run start:dev   # outro terminal

npm run import:vehicles:demo -- --dry-run   # simular
npm run import:vehicles:demo               # Alpha + Beta (6 itens)
npm run import:vehicles:alpha              # só Alpha (3 itens)
npm run import:vehicles:beta               # só Beta (3 itens)
```

Detalhes das colunas do CSV: [IMPORT-VEHICLES.md](./IMPORT-VEHICLES.md).

## Moderador (plataforma)

Login: `moderator@wpscar.com.br` / `Moderator@123` → tela `/plataforma` com métricas por empresa. Ver [API-PLATFORM.md](./API-PLATFORM.md).

## Criar empresa pela API (plataforma)

Usuário **moderador** (`moderator@wpscar.com.br`) pode chamar `POST /tenants`, mas isso **não** cria admin nem catálogos — use o seed ou crie usuário manualmente depois.
