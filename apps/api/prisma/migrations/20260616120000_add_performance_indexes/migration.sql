-- Performance indexes for dashboards, reports and lookups at scale

CREATE INDEX "vehicle_financials_tenant_id_sale_date_idx"
  ON "vehicle_financials"("tenant_id", "sale_date");

CREATE INDEX "vehicle_financials_tenant_id_seller_id_sale_date_idx"
  ON "vehicle_financials"("tenant_id", "seller_id", "sale_date");

CREATE INDEX "sales_tenant_id_status_sale_date_idx"
  ON "sales"("tenant_id", "status", "sale_date");

CREATE INDEX "sales_tenant_id_seller_id_sale_date_idx"
  ON "sales"("tenant_id", "seller_id", "sale_date");

CREATE INDEX "vehicle_costs_tenant_id_vehicle_id_cost_date_idx"
  ON "vehicle_costs"("tenant_id", "vehicle_id", "cost_date");
