# API — Clientes & Fornecedores

## Clientes

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/customers` | `customers:read` | Lista paginada |
| GET | `/customers/:id` | `customers:read` | Detalhe |
| POST | `/customers` | `customers:create` | Cadastra |
| PATCH | `/customers/:id` | `customers:update` | Atualiza |
| PATCH | `/customers/:id/deactivate` | `customers:update` | Inativa |
| GET | `/customers/:id/history` | `customers:read` | Histórico |
| POST | `/customers/:id/history` | `customers:update` | Adiciona observação |

**Query:** `page`, `limit`, `search`, `customerType`, `assignedSellerId`, `active`

### Criar cliente

```json
POST /api/v1/customers
{
  "name": "Maria Silva",
  "document": "12345678901",
  "phone": "11988887777",
  "email": "maria@email.com",
  "customerType": "BUYER",
  "assignedSellerId": "uuid-vendedor",
  "street": "Rua das Flores",
  "number": "100",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "01001000"
}
```

**Tipos de cliente:** `BUYER`, `SELLER`, `BOTH`

**PersonType:** inferido pelo documento (11 = PF, 14 = PJ) ou informado manualmente.

### Histórico

Ações automáticas: `CREATED`, `UPDATED`, `DEACTIVATED`

Observação manual:

```json
POST /api/v1/customers/{id}/history
{ "note": "Cliente interessado no Gol 2021" }
```

### Regra do vendedor

- `SELLER` vê apenas clientes onde é o **vendedor responsável**
- Ao cadastrar, o vendedor é atribuído automaticamente a si mesmo

---

## Fornecedores

| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/suppliers` | `suppliers:read` | Lista paginada |
| GET | `/suppliers/:id` | `suppliers:read` | Detalhe |
| POST | `/suppliers` | `suppliers:create` | Cadastra |
| PATCH | `/suppliers/:id` | `suppliers:update` | Atualiza |
| PATCH | `/suppliers/:id/deactivate` | `suppliers:update` | Inativa |
| GET | `/suppliers/:id/history` | `suppliers:read` | Histórico |
| POST | `/suppliers/:id/history` | `suppliers:update` | Adiciona observação |

**Query:** `page`, `limit`, `search`, `category`, `active`

### Categorias

`INDIVIDUAL`, `COMPANY`, `AUCTION`, `DEALERSHIP`, `INSURANCE`, `BANK`, `PRIVATE`

### Exemplo

```json
POST /api/v1/suppliers
{
  "name": "Leilão Nacional",
  "document": "12345678000199",
  "category": "AUCTION",
  "phone": "1133334444",
  "email": "contato@leilao.com"
}
```

---

## Regras gerais

- CPF/CNPJ único por empresa (tenant)
- Documento armazenado apenas com dígitos
- Endereço opcional em ambos os cadastros
- Histórico auditável com `userId` e timestamp
