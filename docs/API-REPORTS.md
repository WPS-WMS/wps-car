# API — Relatórios exportáveis

Base: `/reports`

**Permissão:** `reports:read`

**Query obrigatória:** `format` = `pdf` | `xlsx`

**Query opcional (vendas e resumo):** `startDate`, `endDate` (ISO date)  
**Query opcional (vendas):** `status` (status da venda)

Resposta: arquivo binário com `Content-Disposition: attachment`.

---

## Relatório geral (JSON)

Documento funcional completo (banco, regras, critérios de aceite): [GENERAL-REPORT.md](./GENERAL-REPORT.md)

`GET /reports/general`

**Roles:** `ADMIN`, `MANAGER`

**Query opcional:** `startDate`, `endDate`, `vehicleType`, `sellerId`, `status`

Resposta:

```json
{
  "salesCount": 12,
  "totalRevenue": "620000.00",
  "totalAcquisitionCost": "480000.00",
  "totalOperationalCosts": "35000.00",
  "grossProfit": "105000.00",
  "grossMarginPercent": "16.94",
  "totalCommission": "18600.00",
  "estimatedNetResult": "86400.00"
}
```

**Fórmulas agregadas (vendas filtradas):**

| Campo | Cálculo |
|-------|---------|
| `totalRevenue` | Soma dos valores de venda |
| `totalAcquisitionCost` | Soma do valor de compra (ficha financeira) |
| `totalOperationalCosts` | Soma dos custos vinculados aos veículos |
| `grossProfit` | Receita − Aquisição − Custos operacionais |
| `grossMarginPercent` | (Lucro bruto ÷ Receita) × 100 |
| `totalCommission` | Soma das comissões (snapshot em vendas finalizadas) |
| `estimatedNetResult` | Lucro bruto − Comissão total |

---

## Estoque

`GET /reports/stock/export?format=pdf`

Exporta todos os veículos em estoque (em estoque, reservado, preparação, manutenção).

Colunas: placa, marca, modelo, ano, compra, custos, anunciado, margem prevista, dias, status.

---

## Vendas

`GET /reports/sales/export?format=xlsx&startDate=2026-01-01&endDate=2026-05-19`

Lista vendas do tenant. **Vendedor (`SELLER`):** apenas as próprias vendas.

Colunas: data, veículo, placa, cliente, vendedor, valor, pagamento, status, comissão.

---

## Resumo gerencial

`GET /reports/summary/export?format=pdf`

**Roles:** `ADMIN`, `MANAGER`

Métricas de estoque, vendas no período e ranking de vendedores (mesma base do dashboard gerencial).

---

## Frontend

Botões **PDF** e **Excel** nas telas Dashboard (gerentes), Estoque e Vendas.
