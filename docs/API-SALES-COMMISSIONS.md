# API — Vendas & Comissões

## Vendas

Base: `/sales`

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/` | `sales:read` | Lista paginada |
| GET | `/:id` | `sales:read` | Detalhe |
| POST | `/` | `sales:create` | Registrar venda |
| PATCH | `/:id` | `sales:update` | Atualizar / mudar status |
| GET | `/commissions/me` | `commissions:read` | Resumo das próprias comissões |
| GET | `/commissions/seller/:sellerId` | `sales:read` + ADMIN/MANAGER | Resumo por vendedor |

**Query:** `page`, `limit`, `search`, `status`, `vehicleId`, `sellerId`, `customerId`, `startDate`, `endDate`

### Status

| Status | Efeito no veículo |
|--------|-------------------|
| `NEGOTIATION` | `RESERVED` |
| `AWAITING_PAYMENT` | `RESERVED` |
| `SOLD` / `COMPLETED` | `SOLD` + atualiza financeiro + calcula comissão |
| `CANCELLED` | Libera reserva ou reverte venda finalizada |

### Criar venda

```json
POST /api/v1/sales
{
  "vehicleId": "uuid",
  "customerId": "uuid",
  "sellerId": "uuid",
  "amount": 62000,
  "paymentMethod": "PIX",
  "saleDate": "2026-05-19",
  "status": "NEGOTIATION"
}
```

**Vendedor (`SELLER`):** `sellerId` é atribuído automaticamente; só vê/edita suas vendas.

### Finalizar venda

```json
PATCH /api/v1/sales/{id}
{ "status": "COMPLETED" }
```

Atualiza automaticamente:
- `VehicleFinancial` (valor, data, cliente, vendedor)
- Resultado financeiro (lucro, margem, comissão)
- `Sale.commission` com valor calculado (**snapshot congelado** — ver [product/FINANCIAL-RESULT.md](./product/FINANCIAL-RESULT.md))

---

## Regras de comissão

Base: `/commission-rules`

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/` | `commissions:read` |
| GET | `/:id` | `commissions:read` |
| POST | `/` | `commissions:configure` |
| PATCH | `/:id` | `commissions:configure` |
| PATCH | `/:id/deactivate` | `commissions:configure` |

Perfis permitidos: `ADMIN`, `MANAGER`, `SELLER` — **não** `MODERATOR`.

### Comissão do vendedor

Além de override por veículo e regra padrão da empresa, configure comissão individual via `PATCH /users/:id` (`commissionType`, `commissionValue`) ou UI **Configurações → Comissão por vendedor**.

Prioridade no cálculo: override veículo → regra do vendedor → regra padrão da empresa.

### Tipos

| Tipo | Cálculo |
|------|---------|
| `SALE_PERCENTAGE` | % sobre valor de venda |
| `PROFIT_PERCENTAGE` | % sobre lucro (venda − compra − custos) |
| `FIXED_AMOUNT` | Valor fixo |
| `CUSTOM_PER_VEHICLE` | Valor fixo (via override) |

Apenas **uma regra padrão** (`isDefault: true`) por empresa.

### Exemplo

```json
POST /api/v1/commission-rules
{
  "name": "Comissão 3% venda",
  "type": "SALE_PERCENTAGE",
  "value": 3,
  "isDefault": true
}
```

---

## Comissão por veículo (override)

Base: `/vehicles/{vehicleId}/commission-override`

| Método | Permissão | Descrição |
|--------|-----------|-----------|
| GET | `commissions:read` | Consulta override |
| PUT | `commissions:configure` | Define override + recalcula |
| DELETE | `commissions:configure` | Remove override + recalcula |

```json
PUT /api/v1/vehicles/{id}/commission-override
{
  "type": "FIXED_AMOUNT",
  "value": 1500
}
```

Prioridade (negociações abertas): **override do veículo** → **regra do vendedor** → **regra padrão**.

Vendas finalizadas (`SOLD` / `COMPLETED`): comissão **congelada** em `Sale.commission` — alterações de regra não afetam retroativamente. Detalhes: [product/FINANCIAL-RESULT.md](./product/FINANCIAL-RESULT.md).

---

## Resumo de comissões (vendedor)

```http
GET /api/v1/sales/commissions/me?startDate=2026-05-01&endDate=2026-05-31
```

Resposta:

```json
{
  "salesCount": 5,
  "totalSalesAmount": "310000.00",
  "totalCommission": "6200.00"
}
```
