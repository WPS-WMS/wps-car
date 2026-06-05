-- Add optional contact fields to users
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "phone" text,
ADD COLUMN IF NOT EXISTS "address" text,
ADD COLUMN IF NOT EXISTS "deactivated_at" timestamp(3),
ADD COLUMN IF NOT EXISTS "deactivation_reason" text;

-- Seller commission rule (default per seller)
-- OBS: Neste projeto, ids são TEXT (não UUID) nas migrations iniciais.
DROP TABLE IF EXISTS "seller_commission_rules";
CREATE TABLE IF NOT EXISTS "seller_commission_rules" (
  "id" TEXT NOT NULL,
  "tenant_id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  "type" "CommissionRuleType" NOT NULL,
  "value" numeric(14,4) NOT NULL DEFAULT 0,
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(3) NOT NULL,
  CONSTRAINT "seller_commission_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seller_commission_rules_seller_id_key"
ON "seller_commission_rules"("seller_id");

CREATE INDEX IF NOT EXISTS "seller_commission_rules_tenant_id_active_idx"
ON "seller_commission_rules"("tenant_id", "active");

ALTER TABLE "seller_commission_rules"
ADD CONSTRAINT "seller_commission_rules_tenant_id_fkey"
FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "seller_commission_rules"
ADD CONSTRAINT "seller_commission_rules_seller_id_fkey"
FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

