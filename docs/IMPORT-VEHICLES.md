# Importação em lote — Veículos e produtos

Script para cadastrar vários veículos ou produtos de uma vez, a partir de um arquivo **CSV**, usando a mesma API do sistema (validações de placa, chassi, ficha financeira e estoque).

---

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| [scripts/vehicles-import.example.csv](../scripts/vehicles-import.example.csv) | Modelo de planilha com exemplos |
| [apps/api/scripts/bulk-import-vehicles.ts](../apps/api/scripts/bulk-import-vehicles.ts) | Script de importação |

---

## Pré-requisitos

1. API rodando (`npm run start:dev` em `apps/api`).
2. Banco com tenant e usuário admin (ex.: após `npm run db:seed` em `apps/api`).
3. Node.js 18+.

---

## Uso rápido

```bash
cd apps/api

# Simular (não grava no banco)
npm run import:vehicles -- --file=../../scripts/vehicles-import.example.csv --dry-run

# Importar de verdade
npm run import:vehicles -- --file=../../scripts/vehicles-import.example.csv
```

Planilha com separador `;` (Excel BR):

```bash
npm run import:vehicles -- --file=./meus-veiculos.csv --delimiter=;
```

---

## Credenciais (`.env` na raiz ou `apps/api`)

| Variável | Padrão |
|----------|--------|
| `IMPORT_API_URL` | `http://localhost:3001/api/v1` |
| `IMPORT_EMAIL` | `admin@revendademo.com.br` |
| `IMPORT_PASSWORD` | `Admin@123` |
| `IMPORT_TENANT_CNPJ` | `00000000000191` |

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

### Produto (`tipo` = `PRODUCT`)

Não use placa, chassi, km, combustível etc. — o script ignora esses campos (igual ao formulário web).

---

## O que o script faz por linha

1. Valida campos obrigatórios.
2. Faz login na API.
3. `POST /vehicles` com o payload (cria veículo + ficha financeira + movimento de estoque).
4. Exibe sucesso ou erro por linha.

---

## Dicas

- Copie `vehicles-import.example.csv`, preencha no Excel/Google Sheets e salve como **CSV UTF-8**.
- Rode sempre `--dry-run` antes da importação real.
- Placas e chassis duplicados geram erro da API (409).
- Linhas que começam com `#` são ignoradas.

---

## Campos do formulário web não incluídos no CSV

Estes continuam só pela interface (após criar o item):

- Fotos do veículo
- Custos detalhados
- FIPE / sugestão de compra
- Override de comissão

Podem ser adicionados em uma versão futura do importador.
