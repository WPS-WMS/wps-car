-- Busca textual acelerada em clientes, fornecedores e vendas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS customers_name_trgm_idx
  ON customers USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS customers_email_trgm_idx
  ON customers USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS suppliers_name_trgm_idx
  ON suppliers USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS sales_notes_trgm_idx
  ON sales USING gin (notes gin_trgm_ops);
