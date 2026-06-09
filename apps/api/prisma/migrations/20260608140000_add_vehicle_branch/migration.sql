-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "branch_id" TEXT;

-- CreateIndex
CREATE INDEX "vehicles_tenant_id_branch_id_idx" ON "vehicles"("tenant_id", "branch_id");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "tenant_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
