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

**Query:** `page`, `limit`, `search`, `status`, `type`, `brand`, `licensePlate`, `branchId`, `sortBy`, `sortOrder`

**Tipos (`type`):** `CAR`, `MOTORCYCLE`, `TRUCK`, `UTILITY`, `PRODUCT`, `OTHER` — `PRODUCT` = peças/acessórios.

### Criar veículo

```json
POST /api/v1/vehicles
{
  "type": "CAR",
  "brand": "Volkswagen",
  "model": "Gol",
  "branchId": null,
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

## Documentos do veículo

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/vehicles/:vehicleId/documents` | `vehicles:read` | Lista anexos |
| POST | `/vehicles/:vehicleId/documents` | `vehicles:update` | Upload (`multipart/form-data`) |
| DELETE | `/vehicles/:vehicleId/documents/:documentId` | `vehicles:update` | Remove documento |

**Campos do upload:** `file` (arquivo), `documentType` (tipo)

**Tipos (`documentType`):** `CRLV`, `INVOICE`, `PURCHASE_CONTRACT`, `SALE_CONTRACT`, `CAUTELAR_REPORT`, `OTHER`

Formatos: PDF, JPEG, PNG, WebP (máx. 10MB).

Fotos do veículo continuam em `/photos`. Comprovantes de custo ficam em `/costs/:costId/receipt`.

---

## Estoque

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/stock` | `stock:read` | Visão estoque (foto, placa, valores, margem) |
| GET | `/stock/plate/:plate/lookup` | `stock:read` | Consulta completa por placa |
| GET | `/stock/plate/:plate` | `stock:read` | Busca por placa (resumo) |
| GET | `/stock/movements` | `stock:read` | Histórico de movimentações |
| POST | `/stock/movements` | `stock:move` | Entrada, saída, reserva, etc. |

Por padrão, `/stock` lista veículos com status: em estoque, reservado, em preparação ou em manutenção.

### Item do estoque (resumo)

- `photo`, `licensePlate`, `brand`, `model`, `year`
- `purchaseValue`, `totalCosts`, `listedValue`, `saleValue`
- `expectedMargin` (anunciado − compra − custos)
- `status`, `daysInStock`

### Consulta por placa (`GET /stock/plate/:plate/lookup`)

Retorna `{ found: false, plate }` ou, se encontrado:

- `vehicle` — dados principais e status
- `purchase` — compra (valor, data, fornecedor, FIPE, anunciado)
- `sales` — histórico de vendas
- `costs` — custos vinculados
- `financialResult` — resultado calculado
- `stockMovements` — movimentações recentes

Placa inválida → `400`. Veículo inexistente → `200` com `found: false`.

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
