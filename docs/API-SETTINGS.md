# API — Configurações

## Parâmetros gerais (tenant)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/settings` | `settings:read` | Todas as configurações (merge com padrões) |
| GET | `/settings/defaults` | `settings:read` | Valores padrão do sistema |
| PATCH | `/settings` | `settings:update` | Atualiza em lote |

```json
PATCH /api/v1/settings
{
  "settings": {
    "default_margin_percent": 12,
    "default_purchase_margin_percent": 15,
    "estimated_prep_costs_default": 2500,
    "company_display_name": "Minha Revenda",
    "notification_email": "contato@revenda.com"
  }
}
```

### Chaves conhecidas

| Chave | Descrição |
|-------|-----------|
| `default_margin_percent` | Margem padrão de venda (%) |
| `default_purchase_margin_percent` | Margem padrão na compra (%) |
| `estimated_prep_costs_default` | Custos estimados de preparação (R$) |
| `company_display_name` | Nome exibido |
| `notification_email` | E-mail de notificações |

---

## Catálogos

Padrão CRUD para cada recurso: `GET`, `POST`, `PATCH /:id`, `PATCH /:id/deactivate`

| Recurso | Base |
|---------|------|
| Tipos de veículo | `/settings/vehicle-types` |
| Tipos de custo | `/settings/cost-types` |
| Formas de pagamento | `/settings/payment-methods` |
| Status customizados | `/settings/statuses` |
| Templates de e-mail | `/settings/email-templates` |
| Filiais (vinculadas ao tenant/matriz) | `/settings/branches` |

**Query comum:** `?activeOnly=true`

### Filiais (matriz = tenant)

A **matriz** é o registro em `tenants` (empresa do SaaS). **Filiais** são unidades (`tenant_branches`) com `tenantId` apontando para essa matriz.

```json
POST /api/v1/settings/branches
{
  "name": "Filial Campinas",
  "address": "Av. Exemplo, 100",
  "phone": "19999999999"
}
```

### Status

```json
POST /api/v1/settings/statuses
{
  "entity": "vehicle",
  "name": "Em análise",
  "code": "under_review",
  "color": "#FFA500",
  "sortOrder": 10
}
```

**Entidades sugeridas:** `vehicle`, `sale`

### Template de e-mail

```json
POST /api/v1/settings/email-templates
{
  "code": "sale_completed",
  "subject": "Compra concluída",
  "bodyHtml": "<p>Olá {{customerName}}</p>"
}
```

### Item de catálogo

```json
POST /api/v1/settings/vehicle-types
{
  "name": "SUV",
  "code": "suv",
  "sortOrder": 5,
  "active": true
}
```

`code`: apenas `a-z`, `0-9` e `_`
