# Importação em lote — Veículos e produtos

Script para cadastrar vários veículos ou produtos de uma vez, a partir de um arquivo **CSV**, usando a mesma API do sistema (validações de placa, chassi, ficha financeira e estoque).

Suporta as **duas empresas demo** (Alpha e Beta) com login automático por tenant.

---

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| [scripts/vehicles-import-alpha.example.csv](../scripts/vehicles-import-alpha.example.csv) | Estoque exemplo — Revenda Demo WPS (Alpha) |
| [scripts/vehicles-import-beta.example.csv](../scripts/vehicles-import-beta.example.csv) | Estoque exemplo — Revenda Beta WPS |
| [scripts/vehicles-import-demo.csv](../scripts/vehicles-import-demo.csv) | Alpha + Beta na mesma planilha (coluna `tenant`) |
| [scripts/vehicles-import.example.csv](../scripts/vehicles-import.example.csv) | Modelo legado (equivale à Alpha) |
| [apps/api/scripts/bulk-import-vehicles.ts](../apps/api/scripts/bulk-import-vehicles.ts) | Script de importação |

---

## Empresas demo

| Tenant | E-mail admin (senha `Admin@123`) |
|--------|----------------------------------|
| Alpha | `admin@revendademo.com.br` |
| Beta | `admin@revendabeta.com.br` |

Login na API/script: e-mail + senha (CNPJ opcional na API).

---

## Pré-requisitos

1. API rodando (`npm run start:dev` em `apps/api`).
2. Banco com seed aplicado (`npm run db:seed` ou `db:seed` + `db:seed:beta`).
3. Node.js 18+.

---

## Uso rápido

```bash
cd apps/api

# Simular importação das duas empresas (planilha com coluna tenant)
npm run import:vehicles:demo -- --dry-run

# Importar estoque demo nas duas empresas
npm run import:vehicles:demo

# Só Alpha
npm run import:vehicles:alpha

# Só Beta
npm run import:vehicles:beta

# Manual
npm run import:vehicles -- --file=../../scripts/vehicles-import-alpha.example.csv --tenant=alpha --dry-run
npm run import:vehicles -- --file=../../scripts/vehicles-import-beta.example.csv --tenant=beta
```

Planilha com separador `;` (Excel BR):

```bash
npm run import:vehicles -- --file=./meus-veiculos.csv --delimiter=; --tenant=alpha
```

---

## Parâmetro `--tenant`

| Valor | Comportamento |
|-------|----------------|
| `alpha` (padrão) | Todas as linhas vão para a Revenda Demo WPS |
| `beta` | Todas as linhas vão para a Revenda Beta WPS |
| `all` | Sem coluna `tenant` no CSV: cada linha é importada nas **duas** empresas. Com coluna `tenant`: cada linha vai só para a empresa indicada |

Coluna opcional no CSV: `tenant`, `empresa`, `tenant_cnpj` ou `cnpj` — valores `alpha`, `beta` ou o CNPJ.

---

## Credenciais (`.env` na raiz ou `apps/api`)

| Variável | Padrão |
|----------|--------|
| `IMPORT_API_URL` | `http://localhost:3001/api/v1` |
| `IMPORT_TENANT` | `alpha` (`alpha`, `beta` ou `all`) |
| `IMPORT_TENANT_CNPJ` | Legado — mapeia CNPJ para alpha/beta |
| `IMPORT_EMAIL` | Sobrescreve admin (apenas com um tenant) |
| `IMPORT_PASSWORD` | Sobrescreve senha (apenas com um tenant) |

Com `--tenant=all` ou planilha mista, o script usa o admin de cada empresa automaticamente (definido no seed).

---

## Colunas do CSV

Cabeçalho na **primeira linha**. Nomes em português ou inglês.

### Obrigatórios

| Coluna | Exemplo | Observação |
|--------|---------|------------|
| `tipo` | `CAR`, `PRODUCT`, `MOTORCYCLE`… | Tipo do item |
| `marca` | Volkswagen | |
| `modelo` | Gol | |
| `ano_fabricacao` | 2020 | |
| `ano_modelo` | 2021 | Para produto pode repetir o ano de fabricação |
| `valor_compra` | 45000.00 | Aceita `45000,00` |

### Opcionais (veículo)

| Coluna | Exemplo |
|--------|---------|
| `versao` | 1.0 MSI |
| `placa` | ABC1D23 |
| `renavam` | |
| `chassi` | |
| `cor` | Prata |
| `km` | 45000 |
| `combustivel` | FLEX, GASOLINE, DIESEL… |
| `cambio` | MANUAL, AUTOMATIC… |
| `portas` | 4 |
| `categoria` | HATCH, SUV, SEDAN… |
| `status` | IN_STOCK (padrão) |
| `observacoes` | Texto livre |
| `data_compra` | 2026-05-01 |
| `valor_anunciado` | 52000.00 |

### Multi-tenant

| Coluna | Exemplo |
|--------|---------|
| `tenant` | `alpha` ou `beta` |

### Produto (`tipo` = `PRODUCT`)

Não use placa, chassi, km, combustível etc. — o script ignora esses campos (igual ao formulário web).

---

## O que o script faz por linha

1. Valida campos obrigatórios.
2. Resolve a empresa (CLI `--tenant` ou coluna `tenant`).
3. Faz login na API (um token por empresa).
4. `POST /vehicles` com o payload (cria veículo + ficha financeira + movimento de estoque).
5. Exibe sucesso ou erro por linha e tenant.

---

## Dicas

- Para QA multi-tenant, use `npm run import:vehicles:demo` após o seed.
- Rode sempre `--dry-run` antes da importação real.
- Placas e chassis duplicados **na mesma empresa** geram erro da API (409).
- Linhas que começam com `#` são ignoradas.
- Copie os CSV de exemplo, preencha no Excel/Google Sheets e salve como **CSV UTF-8**.

---

## Campos do formulário web não incluídos no CSV

Estes continuam só pela interface (após criar o item):

- Fotos do veículo
- Custos detalhados
- FIPE / sugestão de compra
- Override de comissão

Podem ser adicionados em uma versão futura do importador.
