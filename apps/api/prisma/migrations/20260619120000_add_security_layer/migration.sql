-- User: 2FA + invalidação de access tokens
ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "totp_secret" TEXT;
ALTER TABLE "users" ADD COLUMN "totp_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Refresh tokens: detecção de reuso (família de rotação)
ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" TEXT;

CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- Audit log
CREATE TYPE "AuditAction" AS ENUM (
  'AUTH_LOGIN_SUCCESS',
  'AUTH_LOGIN_FAILED',
  'AUTH_LOGOUT',
  'AUTH_LOGOUT_ALL',
  'AUTH_PASSWORD_RESET',
  'AUTH_REFRESH_REUSE',
  'AUTH_2FA_ENABLED',
  'AUTH_2FA_DISABLED',
  'AUTH_2FA_FAILED',
  'USER_PASSWORD_RESET',
  'USER_PERMISSIONS_UPDATED',
  'VEHICLE_DELETED',
  'SALE_CREATED'
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_tenant_id_created_at_idx" ON "audit_logs"("tenant_id", "created_at");
CREATE INDEX "audit_logs_user_id_created_at_idx" ON "audit_logs"("user_id", "created_at");
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
