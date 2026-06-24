# API — Precificação inteligente

Sugestão de preço de venda combinando FIPE, histórico interno, estoque similar, portais e margem mínima.

Base: `/pricing-intelligence`

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| POST | `/analyze` | `pricing-intelligence:read` | Analisa veículo e retorna faixas de preço |
| GET | `/history` | `pricing-intelligence:read` | Histórico paginado de análises |

## POST `/analyze`

```json
{
  "vehicleId": "uuid-do-veiculo",
  "minMarginPercent": 12
}
```

`minMarginPercent` é opcional; padrão vem de `default_margin_percent` nas configurações do tenant.

## Resposta

- `vehicle` — dados do veículo analisado
- `fipe` — valor FIPE (placa, ficha financeira ou indisponível)
- `sources` — histórico interno, estoque similar, portais, tempo médio de venda
- `context` — investimento, margem mínima, referência de mercado, piso financeiro
- `suggestions`:
  - `conservative` — preço conservador (+ margem, giro mais lento)
  - `competitive` — alinhado ao mercado
  - `aggressive` — giro rápido (com ajuste por tempo em estoque)
  - `idealListing` — sugestão para anúncio (arredondada)
  - `minimumRecommended` — piso com margem mínima desejada
- `insights` — explicações em texto

## Fontes de dados

| Fonte | Descrição |
|-------|-----------|
| FIPE | Consulta por placa (`FIPE_LOOKUP_*`) ou valor da ficha financeira |
| Histórico interno | Média de vendas de veículos semelhantes (marca/modelo, ano ±1) |
| Estoque similar | Média de `listedValue` de veículos parecidos no estoque |
| Portais | Mock local ou APIs HTTP reais (`MARKET_LISTINGS_*`) |
| Tempo em estoque | `daysInStock` do veículo vs média da revenda |

---

## Integração HTTP com portais (passo 1)

Ative o provedor HTTP:

```env
MARKET_LISTINGS_PROVIDER=http
```

### Opção A — um agregador (URL única)

```env
MARKET_LISTINGS_HTTP_URL=https://sua-api.com/market/average?brand={brand}&model={model}&year={year}&mileage={mileage}&fipe={fipeValue}
MARKET_LISTINGS_HTTP_API_KEY=sua-chave
```

Placeholders suportados na URL: `{brand}`, `{model}`, `{year}`, `{modelYear}`, `{mileage}`, `{fipeValue}`.

### Opção B — vários portais em paralelo (recomendado)

```env
MARKET_LISTINGS_HTTP_URLS=[
  {"name":"WebMotors","url":"https://sua-api.com/webmotors?brand={brand}&model={model}&year={year}"},
  {"name":"OLX","url":"https://sua-api.com/olx?brand={brand}&model={model}&year={year}"},
  {"name":"iCarros","url":"https://sua-api.com/icarros?brand={brand}&model={model}&year={year}"}
]
```

Formato alternativo (sem JSON):

```env
MARKET_LISTINGS_HTTP_URLS=WebMotors|https://...,OLX|https://...,iCarros|https://...
```

A API consulta **todos os portais em paralelo**, agrega a média ponderada pelo número de anúncios e devolve `portalQuotes[]` com detalhe por portal.

### Autenticação

```env
# Atalho — envia header X-Api-Key
MARKET_LISTINGS_HTTP_API_KEY=sua-chave

# Ou headers customizados (JSON)
MARKET_LISTINGS_HTTP_HEADERS={"Authorization":"Bearer token","X-Tenant-Id":"revenda-123"}
```

### Resiliência

| Variável | Default | Descrição |
|----------|---------|-----------|
| `MARKET_LISTINGS_HTTP_TIMEOUT_MS` | `8000` | Timeout por portal |
| `MARKET_LISTINGS_HTTP_MIN_SUCCESS` | `1` | Mínimo de portais que devem responder com sucesso |

Se um portal falhar, os demais ainda entram no cálculo. Se nenhum atingir o mínimo, a análise segue sem portais (campo `marketPortals: null`).

---

## Contrato de resposta HTTP (por portal)

O parser aceita vários formatos. Exemplos válidos:

**Agregado direto**

```json
{
  "averageListingPrice": 68900,
  "sampleCount": 24,
  "minPrice": 62000,
  "maxPrice": 74900,
  "referenceMonth": "06/2026"
}
```

**Lista de anúncios**

```json
{
  "listings": [
    { "price": 67500, "portal": "WebMotors" },
    { "preco": 69900 },
    { "valor": 68200 }
  ]
}
```

**Vários portais numa resposta**

```json
{
  "sources": [
    { "name": "WebMotors", "averageListingPrice": 68900, "sampleCount": 14 },
    { "name": "OLX", "precoMedio": 65500, "quantidade": 10 }
  ]
}
```

Campos reconhecidos para preço: `averageListingPrice`, `averagePrice`, `precoMedio`, `valor`, `price`, `preco`, `listingPrice`, `amount`.

---

## Web

- Menu: **Precificação inteligente** (`/precificacao-inteligente`)
- Ficha financeira do veículo: painel embutido com botão **Usar no anúncio**
- Detalhe **Por portal** quando `portalQuotes` estiver disponível
