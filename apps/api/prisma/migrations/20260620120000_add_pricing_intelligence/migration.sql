-- CreateTable
CREATE TABLE "pricing_intelligence_queries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "user_id" TEXT,
    "fipe_value" DECIMAL(14,2),
    "market_reference" DECIMAL(14,2),
    "min_margin_percent" DECIMAL(8,4) NOT NULL,
    "conservative_price" DECIMAL(14,2) NOT NULL,
    "competitive_price" DECIMAL(14,2) NOT NULL,
    "aggressive_price" DECIMAL(14,2) NOT NULL,
    "ideal_listing_price" DECIMAL(14,2) NOT NULL,
    "minimum_recommended" DECIMAL(14,2) NOT NULL,
    "raw_response" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pricing_intelligence_queries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_intelligence_queries_tenant_id_idx" ON "pricing_intelligence_queries"("tenant_id");

-- CreateIndex
CREATE INDEX "pricing_intelligence_queries_tenant_id_vehicle_id_created_at_idx" ON "pricing_intelligence_queries"("tenant_id", "vehicle_id", "created_at");
