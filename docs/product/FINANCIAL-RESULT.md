# Resultado financeiro por veículo — Regras de negócio e critérios de aceite

Documento funcional do módulo **Financeiro → Resultado** (por veículo/produto).

Documentação técnica relacionada:
- [API — Financeiro & Custos](./API-FINANCIAL-COSTS.md)
- [API — Vendas & Comissões](./API-SALES-COMMISSIONS.md)
- [Arquitetura — Resultado financeiro](./ARCHITECTURE.md#resultado-financeiro-domínio)

---

## Objetivo

Calcular e apresentar automaticamente o resultado financeiro individual de cada veículo/produto, com base em compra, custos vinculados, venda e comissão — preservando o histórico de vendas já finalizadas quando regras de comissão forem alteradas.

---

## Fórmulas oficiais

| Indicador | Fórmula |
|-----------|---------|
| **Total de custos** | Soma de todos os custos vinculados ao veículo |
| **Lucro bruto** | Valor de Venda − Valor de Compra − Total de Custos |
| **Margem em R$** | Valor de Venda − Valor de Compra − Total de Custos *(igual ao lucro bruto)* |
| **Comissão paga** | Regra vigente no momento da operação *(congelada após venda finalizada — regras 12 a 17)* |
| **Resultado líquido** | Valor de Venda − Valor de Compra − Total de Custos − Comissão |
| **Margem em %** | (Resultado Líquido ÷ Valor de Venda) × 100 |
| **Dias em estoque** | Data da compra → data da venda (vendido) ou data atual (em estoque) |

---

## Regras de negócio

### Cálculo e exibição dos indicadores

1. O sistema deverá calcular automaticamente todos os indicadores financeiros do veículo.
2. O total de custos deverá ser composto pela soma de todos os custos vinculados ao veículo.
3. O lucro bruto deverá ser calculado pela fórmula:

   **Lucro Bruto = Valor de Venda − Valor de Compra − Total de Custos**

4. A margem em R$ deverá possuir o mesmo valor do lucro bruto e deverá ser calculada pela fórmula:

   **Margem R$ = Valor de Venda − Valor de Compra − Total de Custos**

5. O resultado líquido deverá ser calculado pela fórmula:

   **Resultado Líquido = Valor de Venda − Valor de Compra − Total de Custos − Comissão**

6. A margem percentual deverá ser calculada pela fórmula:

   **Margem % = (Resultado Líquido ÷ Valor de Venda) × 100**

7. A comissão deverá ser considerada separadamente dos demais custos no cálculo do resultado líquido.
8. Os dias em estoque deverão ser calculados:
   - Da **data de compra** até a **data de venda**, para veículos vendidos;
   - Da **data de compra** até a **data atual**, para veículos ainda em estoque.
9. Sempre que houver alteração no **valor de compra**, **valor de venda**, **custos** ou **comissão**, o sistema deverá recalcular automaticamente os indicadores.
10. Os valores monetários deverão ser exibidos com **duas casas decimais**.
11. Os percentuais deverão ser exibidos com **duas casas decimais**.

### Complementos operacionais

12. O **valor de compra** e o **valor de venda** deverão ser obtidos da ficha financeira do veículo (`VehicleFinancial`).
13. Veículos **sem valor de venda** informado não deverão possuir lucro bruto, margem em R$, margem em % ou resultado líquido calculados até que a venda seja concluída.
14. O botão **“Recalcular resultado”** é opcional; o recálculo automático (regra 9) é o comportamento padrão do sistema.

### Resolução da comissão (negociações em aberto)

15. Para veículos **sem venda finalizada**, a comissão deverá ser resolvida nesta ordem de prioridade:
    1. Override por veículo (`VehicleCommissionOverride`);
    2. Regra personalizada do vendedor (`SellerCommissionRule`);
    3. Regra padrão da revenda (`CommissionRule` com `isDefault: true`).

### Congelamento de comissão (vendas finalizadas)

16. Quando a venda atingir status **`SOLD`** (Vendido) ou **`COMPLETED`** (Finalizado), o sistema deverá:
    - calcular a comissão com a regra vigente naquele momento;
    - gravar o valor em `Sale.commission` (snapshot histórico);
    - refletir o mesmo valor em `VehicleFinancial.commissionValue`.

17. Em **recálculos posteriores** de veículos com venda finalizada, a comissão **não** deverá ser recalculada a partir das regras atuais do vendedor ou da revenda. Deverá ser utilizado o valor congelado em `Sale.commission`.

18. Alterações na comissão do vendedor (**Configurações → Usuários**), na regra padrão da revenda ou em overrides **não** deverão alterar retroativamente a comissão de vendas já finalizadas.

19. Em vendas finalizadas, **lucro bruto**, **margem em R$**, **margem em %** e **resultado líquido** deverão continuar sendo recalculados quando houver alteração em compra, venda ou custos — utilizando sempre a **comissão congelada**.

20. Se uma venda finalizada for **cancelada** (`CANCELLED`), o snapshot de comissão deverá ser removido e o veículo deverá voltar a utilizar as regras vigentes nos recálculos futuros.

### Contexto SaaS (multi-tenant)

21. Cada revenda (tenant) possui regras e histórico financeiros isolados. O congelamento de comissão garante **auditoria e confiabilidade** dos relatórios por período, evitando que mudanças de política comercial reescrevam resultados passados.

---

## Critérios de aceite

### Cenário 1: Visualização dos indicadores financeiros

**Dado** que o veículo possua informações financeiras cadastradas  
**Quando** o usuário acessar a aba **Financeiro**, seção **Resultado**  
**Então** o sistema deve exibir todos os indicadores calculados:

- Valor de compra
- Total de custos
- Valor de venda
- Lucro bruto
- Margem em R$
- Margem em %
- Comissão paga
- Resultado líquido
- Dias em estoque

---

### Cenário 2: Atualização automática após inclusão de custo

**Dado** que o veículo possua resultado financeiro calculado  
**Quando** um novo custo for cadastrado para o veículo  
**Então** o sistema deve recalcular automaticamente os indicadores afetados (custos, lucro, margens e resultado líquido).

---

### Cenário 3: Atualização automática após alteração da venda

**Dado** que o veículo possua uma venda registrada  
**Quando** o valor da venda for alterado (venda em andamento ou finalizada, conforme permissões)  
**Então** o sistema deve recalcular automaticamente lucro, margens e resultado líquido.

**E** se a venda estiver finalizada, a comissão deve permanecer congelada conforme regras **16 a 19** (salvo primeira finalização ou cancelamento — regra **20**).

---

### Cenário 4: Cálculo dos dias em estoque

**Dado** que o veículo possua data de compra cadastrada  
**Quando** o usuário visualizar os indicadores financeiros  
**Então** o sistema deve apresentar:
- **Vendido:** dias entre data de compra e data de venda;
- **Em estoque:** dias entre data de compra e data atual.

---

### Cenário 5: Veículo ainda não vendido

**Dado** que o veículo não possua valor de venda informado  
**Quando** o usuário acessar a aba **Financeiro**, seção **Resultado**  
**Então** o sistema deve exibir os indicadores disponíveis (compra, custos, dias em estoque)  
**E** lucro bruto, margem e resultado líquido devem permanecer vazios/indisponíveis  
**E** informar que o resultado final depende da conclusão da venda.

---

### Cenário 6: Resultado negativo

**Dado** que os custos totais da operação sejam superiores ao ganho obtido na venda  
**Quando** o resultado financeiro for calculado  
**Então** o sistema deve exibir normalmente os valores negativos, representando prejuízo na negociação.

---

### Cenário 7: Alteração da comissão do vendedor não afeta vendas passadas

**Dado** que exista uma venda com status **`SOLD`** ou **`COMPLETED`** e comissão já calculada (regra **16**)  
**Quando** a comissão do vendedor for alterada em **Configurações → Usuários**  
**Então** a comissão registrada na venda finalizada **não** deve ser alterada (regra **18**)  
**E** os relatórios históricos de comissão devem manter o valor original.

---

### Cenário 8: Nova regra de comissão aplica-se apenas a negociações abertas

**Dado** que um vendedor tenha veículos em negociação e vendas já finalizadas  
**Quando** sua regra de comissão for atualizada  
**Então** veículos **sem venda finalizada** devem usar a nova regra no próximo recálculo (regra **15**)  
**E** veículos **com venda finalizada** devem manter a comissão congelada (regra **17**).

---

### Cenário 9: Cancelamento libera recálculo por regra vigente

**Dado** que uma venda finalizada possua comissão congelada (regra **16**)  
**Quando** a venda for cancelada  
**Então** o snapshot de comissão deve ser removido (regra **20**)  
**E** o veículo deve voltar a calcular comissão pelas regras atuais em recálculos futuros (regra **15**).

---

## Onde isso aparece no sistema

| Tela / módulo | Comportamento |
|---------------|---------------|
| Veículo → Financeiro → Resultado | Exibe todos os indicadores |
| Veículo → Custos | Inclusão/edição/exclusão dispara recálculo |
| Vendas → Finalizar | Calcula comissão e congela em `Sale.commission` |
| Configurações → Usuários (comissão vendedor) | Afeta apenas negociações abertas |
| Relatórios → Comissão | Usa `Sale.commission` das vendas no período |
| Relatórios → Geral | Agrega receita, custos, lucro e comissão — ver [GENERAL-REPORT.md](./GENERAL-REPORT.md) |

---

## Implementação (referência técnica)

- Cálculo: `VehicleFinancialCalculatorService`
- Recálculo e congelamento: `FinancialRecalculationService`
- Snapshot na finalização: `SalesService.syncFinancialOnFinalize`
- Campo de snapshot: `sales.commission`
