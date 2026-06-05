# API — Veículos & Estoque

## Veículos

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/vehicles` | `vehicles:read` | Lista paginada |
| GET | `/vehicles/plate/:plate` | `vehicles:read` | Busca por placa |
| GET | `/vehicles/:id` | `vehicles:read` | Detalhe |
| POST | `/vehicles` | `vehicles:create` | Cadastra + financeiro + entrada estoque |
| PATCH | `/vehicles/:id` | `vehicles:update` | Atualiza veículo/financeiro |
| DELETE | `/vehicles/:id` | `vehicles:delete` | Exclui (não vendidos) |

**Query:** `page`, `limit`, `search`, `status`, `type`, `brand`, `licensePlate`, `sortBy`, `sortOrder`

### Criar veículo

```json
POST /api/v1/vehicles
{
  "type": "CAR",
  "brand": "Volkswagen",
  "model": "Gol",
  "manufactureYear": 2020,
  "modelYear": 2021,
  "licensePlate": "ABC1D23",
  "mileage": 45000,
  "fuel": "FLEX",
  "transmission": "MANUAL",
  "purchaseValue": 35000,
  "listedValue": 42000
}
```

**Status possíveis:** `IN_STOCK`, `RESERVED`, `SOLD`, `IN_PREPARATION`, `IN_MAINTENANCE`, `UNAVAILABLE`

---

## Fotos

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/vehicles/:vehicleId/photos` | `vehicles:read` | Lista fotos |
| POST | `/vehicles/:vehicleId/photos` | `vehicles:update` | Upload (`multipart/form-data`, campo `file`) |
| PATCH | `/vehicles/:vehicleId/photos/:photoId/primary` | `vehicles:update` | Define capa |
| DELETE | `/vehicles/:vehicleId/photos/:photoId` | `vehicles:update` | Remove foto |

Arquivos em `./uploads/{tenantId}/vehicles/{vehicleId}/` — servidos em `/uploads/...`

Formatos: JPEG, PNG, WebP (máx. 10MB por padrão).

---

## Estoque

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/stock` | `stock:read` | Visão estoque (foto, placa, valores, margem) |
| GET | `/stock/plate/:plate` | `stock:read` | Busca por placa |
| GET | `/stock/movements` | `stock:read` | Histórico de movimentações |
| POST | `/stock/movements` | `stock:move` | Entrada, saída, reserva, etc. |

Por padrão, `/stock` lista veículos com status: em estoque, reservado, em preparação ou em manutenção.

### Item do estoque (resumo)

- `photo`, `licensePlate`, `brand`, `model`, `year`
- `purchaseValue`, `totalCosts`, `listedValue`, `saleValue`
- `expectedMargin` (anunciado − compra − custos)
- `status`, `daysInStock`

### Movimentação

```json
POST /api/v1/stock/movements
{
  "vehicleId": "uuid",
  "type": "EXIT",
  "description": "Saída para transporte",
  "reference": "NF-123"
}
```

**Tipos:** `ENTRY`, `EXIT`, `ADJUSTMENT`, `RESERVATION`, `RELEASE`

**Status automático (se não informado):**

| Tipo | Status |
|------|--------|
| ENTRY | IN_STOCK |
| EXIT | UNAVAILABLE |
| RESERVATION | RESERVED |
| RELEASE | IN_STOCK |

---

## Regras

- Placa e chassi únicos por empresa
- Veículo `SOLD` não edita, não movimenta, não exclui
- Cadastro de veículo gera `VehicleFinancial` + movimentação `ENTRY` inicial
