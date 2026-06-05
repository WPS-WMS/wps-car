-- Vincula usuário à matriz (branch_id nulo) ou a uma filial do tenant
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "branch_id" TEXT;

CREATE INDEX IF NOT EXISTS "users_branch_id_idx" ON "users"("branch_id");

ALTER TABLE "users"
ADD CONSTRAINT "users_branch_id_fkey"
FOREIGN KEY ("branch_id") REFERENCES "tenant_branches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
