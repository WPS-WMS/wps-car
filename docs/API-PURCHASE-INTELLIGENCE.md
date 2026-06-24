# API — Compra inteligente

Consulta FIPE por placa, cálculo de valor máximo de compra e histórico persistido.

Permissão: `purchase-intelligence:read`

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/purchase-intelligence/analyze` | Analisa placa + FIPE + margem |
| GET | `/purchase-intelligence/history` | Histórico paginado |

## Analisar compra

```json
POST /purchase-intelligence/analyze
{
  "licensePlate": "ABC1D23",
  "desiredMarginPercent": 12,
  "estimatedCosts": 2500
}
```

`desiredMarginPercent` e `estimatedCosts` são opcionais — padrão vem de `tenant_settings` (`default_margin_percent`, `estimated_prep_costs_default`).

### Resposta

- `fipe` — veículo identificado e valor FIPE
- `analysis` — margem, custos e **maxPurchaseValue**
- `existingInStock` — se a placa já existe no estoque da revenda (resumo)
- `queryId` — ID salvo em `purchase_intelligence_queries`

**Fórmula:** `ValorFIPE - MargemDesejada - CustosEstimados`

## Histórico

`GET /purchase-intelligence/history?page=1&limit=10&licensePlate=ABC1D23`

Consultas ficam em `purchase_intelligence_queries` com `raw_response` (JSON).

## Provedor FIPE

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `FIPE_LOOKUP_PROVIDER` | `mock` | `mock` ou `http` |
| `FIPE_LOOKUP_HTTP_URL` | — | URL com `{plate}` (ex.: `https://api.exemplo.com/placa/{plate}`) |
| `FIPE_LOOKUP_HTTP_TIMEOUT_MS` | `8000` | Timeout da API externa |

Em **mock** (local/QA), a placa retorna dados simulados determinísticos — útil para demo sem API paga.

Resposta HTTP esperada (campos flexíveis): `brand`/`marca`, `model`/`modelo`, `modelYear`/`ano`, `fipeValue`/`valor`.

## Relacionados

- Consulta completa no estoque: [API-VEHICLES-STOCK.md](./API-VEHICLES-STOCK.md) (`GET /stock/plate/:plate/lookup`)
- Financeiro por veículo: [API-FINANCIAL-COSTS.md](./API-FINANCIAL-COSTS.md)
