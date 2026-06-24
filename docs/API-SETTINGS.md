# API — Configurações

## Parâmetros gerais (tenant)

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/settings` | `settings:read` | Configurações (merge com padrões) |
| GET | `/settings/defaults` | `settings:read` | Valores padrão |
| PATCH | `/settings` | `settings:update` | Atualiza em lote |

```json
PATCH /settings
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

| Chave | Descrição |
|-------|-----------|
| `notification_email` | Remetente e destino de avisos internos |

---

## Gestão de perfil (menu lateral)

| Método | Rota | Permissão / Role |
|--------|------|------------------|
| GET | `/settings/profile-access` | `settings:read` |
| PUT | `/settings/profile-access` | `settings:update` + ADMIN |

Define quais itens do sidebar **Gerente** e **Vendedor** podem ver. Admin sempre tem acesso total.

```json
PUT /settings/profile-access
{
  "role": "SELLER",
  "enabledFeatures": ["dashboard", "vehicles", "stock", "sales", "customers"]
}
```

---

## E-mails por tipo

Usado pelo frontend em `/configuracoes/emails`.

| Método | Rota | Permissão |
|--------|------|-----------|
| GET | `/settings/email-notifications` | `settings:read` |
| PUT | `/settings/email-notifications/recipients` | `settings:update` |
| PUT | `/settings/email-notifications/:code` | `settings:update` |

**Tipos:** `sale_completed`, `sale_registered`, `vehicle_reserved`, `user_welcome`, `password_reset`

**Destinatários por perfil:** matriz Vendedor / Gerente / Administrador em `email_notification_recipients` (tenant_settings). Tipos com destinatário fixo (`user_welcome`, `password_reset`) não usam a matriz.

```json
PUT /settings/email-notifications/recipients
{
  "rules": [
    { "code": "sale_registered", "roles": ["ADMIN", "MANAGER"] },
    { "code": "sale_completed", "roles": [] }
  ]
}
```

```json
PUT /settings/email-notifications/sale_completed
{
  "active": true,
  "subject": "Parabéns pela compra!",
  "bodyHtml": "<p>Olá {{customerName}}</p>"
}
```

Variáveis: `{{customerName}}`, `{{vehicleName}}`, `{{resetLink}}`, etc. (listadas na resposta GET).

**Envio:** requer SMTP configurado — ver [ENV.md](./ENV.md). Com `MAIL_ENABLED=false`, conteúdo vai para o log da API.

**Disparos automáticos:** nova venda, venda finalizada, usuário criado, forgot-password.

---

## Catálogos

CRUD: `GET`, `POST`, `PATCH /:id`, `PATCH /:id/deactivate`

| Recurso | Base |
|---------|------|
| Tipos de veículo | `/settings/vehicle-types` |
| Tipos de custo | `/settings/cost-types` |
| Formas de pagamento | `/settings/payment-methods` |
| Status customizados | `/settings/statuses` |
| Filiais | `/settings/branches` |

**Legado (não usado pelo frontend):** `/settings/email-templates` — preferir `/settings/email-notifications`.

Query comum: `?activeOnly=true`

### Filiais

Matriz = registro `tenants`. Filiais = `tenant_branches`.

```json
POST /settings/branches
{
  "name": "Filial Campinas",
  "address": "Av. Exemplo, 100",
  "phone": "19999999999"
}
```
