# Teste multi-tenant

Cada **empresa** é um registro em `tenants` (matriz). Tudo — usuários, veículos, vendas, filiais, configurações — fica isolado por `tenantId`.

## Empresas demo (após seed)

| Empresa | CNPJ (login) | Admin |
|---------|----------------|-------|
| Revenda Demo WPS (Alpha) | `00000000000191` | `admin@revendademo.com.br` / `Admin@123` |
| Revenda Beta WPS | `11222333000181` | `admin@revendabeta.com.br` / `Admin@123` |

Cada uma já vem com:
- Catálogos (tipos de veículo, custo, pagamento)
- Regra de comissão padrão
- **2 filiais** de exemplo
- Gerente e vendedor (senhas `Manager@123` / `Seller@123`)

## Como testar

1. Abra o site QA e faça login.
2. No campo **CNPJ da empresa**, use o CNPJ da tabela.
3. Cadastre veículos/vendas em uma empresa.
4. Saia e entre com o **outro CNPJ** — os dados não aparecem (isolamento).

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

## Criar empresa pela API (plataforma)

Usuário **moderador** (`moderator@wpscar.com.br`) pode chamar `POST /tenants`, mas isso **não** cria admin nem catálogos — use o seed ou crie usuário manualmente depois.
