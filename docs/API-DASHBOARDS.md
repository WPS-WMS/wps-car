# API — Dashboards

Base: `/dashboard`

**Query opcional:** `startDate`, `endDate` (ISO — filtra vendas e métricas de período; estoque é sempre o snapshot atual)

---

## Dashboard gerencial

`GET /dashboard/manager` — `dashboard:read` + ADMIN ou MANAGER

```json
{
  "period": { "startDate": "...", "endDate": "..." },
  "stock": {
    "totalStock": 24,
    "totalInvestment": "1250000.00",
    "totalCosts": "85000.00",
    "totalListedValue": "1480000.00",
    "averageStockDaysInStock": 45
  },
  "sales": {
    "salesCount": 8,
    "totalRevenue": "520000.00",
    "totalGrossProfit": "110000.00",
    "totalNetProfit": "95000.00",
    "totalProfit": "95000.00",
    "averageMarginPercent": "18.50",
    "averageTicket": "65000.00",
    "averageDaysInStock": 32,
    "totalCommission": "10400.00"
  }
}
```

| Métrica | Origem |
|---------|--------|
| Total estoque | Veículos em estoque / reserva / preparação / manutenção |
| Investimento total | Soma `purchaseValue` do estoque |
| Custos totais | Soma `totalCosts` do estoque |
| Potencial de venda | Soma `listedValue` do estoque |
| Tempo médio em estoque (atual) | Média `daysInStock` dos itens no estoque |
| Vendas no período | Vendas `SOLD` / `COMPLETED` |
| Receita | Soma `Sale.amount` no período |
| Lucro bruto | Soma `VehicleFinancial.grossProfit` vendidos no período |
| Resultado líquido | Soma `VehicleFinancial.netResult` |
| Margem média | Média de `marginPercent` ou lucro bruto ÷ receita |
| Ticket médio | Receita ÷ quantidade de vendas |
| Tempo médio até a venda | Média `daysInStock` das vendas do período |

---

## Dashboard vendedor

`GET /dashboard/seller` — `dashboard:read` (dados do usuário logado)

```json
{
  "seller": { "id": "...", "name": "João" },
  "vehiclesSold": 5,
  "totalNegotiations": 12,
  "conversionRate": 41.67,
  "totalRevenue": "310000.00",
  "totalCommission": "6200.00"
}
```

| Métrica | Descrição |
|---------|-----------|
| Veículos vendidos | Vendas finalizadas no período |
| Comissão | Soma de comissões |
| Conversão | Vendas finalizadas ÷ total de negociações (%) — base para CRM futuro |

---

## Ranking de vendedores

`GET /dashboard/seller/ranking` — `dashboard:read` + ADMIN ou MANAGER

```json
{
  "ranking": [
    {
      "position": 1,
      "seller": { "id": "...", "name": "Maria", "email": "..." },
      "salesCount": 6,
      "totalRevenue": "380000.00",
      "totalGrossProfit": "72000.00",
      "totalNetProfit": "65000.00",
      "totalCommission": "7600.00",
      "averageMarginPercent": "17.25",
      "conversionRate": 50.0,
      "totalNegotiations": 12
    }
  ]
}
```

Ordenado por receita (maior primeiro).
