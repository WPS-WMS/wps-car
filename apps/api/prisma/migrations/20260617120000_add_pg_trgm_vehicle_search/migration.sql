-- Busca textual acelerada (ILIKE %term%) em veículos
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS vehicles_brand_trgm_idx
  ON vehicles USING gin (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS vehicles_model_trgm_idx
  ON vehicles USING gin (model gin_trgm_ops);

CREATE INDEX IF NOT EXISTS vehicles_license_plate_trgm_idx
  ON vehicles USING gin (license_plate gin_trgm_ops);
