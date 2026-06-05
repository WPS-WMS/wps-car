# API — Financeiro & Custos

## Financeiro por veículo

Base: `/vehicles/{vehicleId}/financial`

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/` | `financial:read` | Dados financeiros completos |
| PATCH | `/` | `financial:update` | Atualiza valores e recalcula |
| POST | `/recalculate` | `financial:update` | Força recálculo do resultado |
| POST | `/suggest-purchase` | `financial:update` | Calcula valor máximo de compra |

### Campos principais

- Compra: `purchaseValue`, `purchaseDate`, `supplierId`
- FIPE: `fipeValue`, `suggestedPurchaseValue`
- Anúncio: `listedValue`, `minimumValue`
- Venda: `saleValue`, `saleDate`, `customerId`, `sellerId`

### Resultado calculado (automático)

Regras de negócio e critérios de aceite: [FINANCIAL-RESULT.md](./FINANCIAL-RESULT.md)

| Campo | Fórmula |
|-------|---------|
| `totalCosts` | Soma dos custos do veículo |
| `grossProfit` | `saleValue - purchaseValue - totalCosts` |
| `marginAmount` | `saleValue - purchaseValue - totalCosts` |
| `commissionValue` | Regra vigente; **congelada** após venda `SOLD`/`COMPLETED` (ver abaixo) |
| `netResult` | `saleValue - purchaseValue - totalCosts - commissionValue` |
| `marginPercent` | `(netResult / saleValue) × 100` |
| `daysInStock` | Dias entre compra e venda (ou hoje) |

### Comissão

**Prioridade (veículos em aberto):**

1. `VehicleCommissionOverride` do veículo (se existir)
2. `SellerCommissionRule` do vendedor (se existir)
3. `CommissionRule` com `isDefault: true`

**Congelamento (vendas finalizadas):**

- Ao finalizar (`SOLD` / `COMPLETED`), a comissão calculada é gravada em `Sale.commission`.
- Recálculos futuros usam esse snapshot; alterações na regra do vendedor **não** afetam vendas já finalizadas.
- Cancelamento da venda remove o snapshot e volta a usar regras vigentes.

Tipos: `SALE_PERCENTAGE`, `PROFIT_PERCENTAGE`, `FIXED_AMOUNT`, `CUSTOM_PER_VEHICLE`

### Sugestão de compra

```json
POST /api/v1/vehicles/{id}/financial/suggest-purchase
{
  "fipeValue": 45000,
  "estimatedCosts": 3000,
  "desiredMarginPercent": 12
}
```

**Fórmula:** `ValorFIPE - MargemDesejada - CustosEstimados`

Informe `desiredMarginPercent` **ou** `desiredMarginAmount`.

---

## Custos por veículo

Base: `/vehicles/{vehicleId}/costs`

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/` | `costs:read` | Lista paginada |
| GET | `/{costId}` | `costs:read` | Detalhe |
| POST | `/` | `costs:create` | Lança custo + recalcula |
| PATCH | `/{costId}` | `costs:create` | Atualiza + recalcula |
| DELETE | `/{costId}` | `costs:create` | Remove + recalcula |

**Tipos:** `PAINTING`, `MECHANICS`, `BODYWORK`, `SANITIZATION`, `DOCUMENTATION`, `TRANSPORT`, `REVISION`, `OTHER`

### Exemplo

```json
POST /api/v1/vehicles/{id}/costs
{
  "type": "MECHANICS",
  "description": "Revisão completa",
  "amount": 850,
  "costDate": "2026-05-01",
  "supplierId": "uuid-fornecedor"
}
```

Resposta inclui `cost` e `financialResult` atualizado.

---

## Seed demo

Regra padrão criada no seed: **2% sobre valor de venda** (`SALE_PERCENTAGE`).
