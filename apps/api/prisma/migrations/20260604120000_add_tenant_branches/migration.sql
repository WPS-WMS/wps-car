-- Filiais vinculadas ao tenant (matriz)
CREATE TABLE "tenant_branches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_branches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tenant_branches_tenant_id_idx" ON "tenant_branches"("tenant_id");

ALTER TABLE "tenant_branches" ADD CONSTRAINT "tenant_branches_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
