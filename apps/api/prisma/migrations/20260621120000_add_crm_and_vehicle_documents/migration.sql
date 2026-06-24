-- CreateEnum
CREATE TYPE "VehicleDocumentType" AS ENUM ('CRLV', 'INVOICE', 'PURCHASE_CONTRACT', 'SALE_CONTRACT', 'CAUTELAR_REPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WHATSAPP', 'PHONE', 'STORE', 'WEBSITE', 'REFERRAL', 'OTHER');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('PHONE', 'WHATSAPP', 'EMAIL', 'VISIT', 'OTHER');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'DONE', 'CANCELLED');

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN "document_type" "VehicleDocumentType";

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN "next_follow_up_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "attachments_tenant_id_entity_type_entity_id_document_type_idx" ON "attachments"("tenant_id", "entity_type", "entity_id", "document_type");

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OTHER',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "seller_id" TEXT,
    "customer_id" TEXT,
    "expected_amount" DECIMAL(14,2),
    "notes" TEXT,
    "next_follow_up_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by_id" TEXT,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_vehicle_interests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_vehicle_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_contacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "channel" "ContactChannel" NOT NULL DEFAULT 'OTHER',
    "summary" TEXT NOT NULL,
    "contacted_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_reminders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_at" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "lead_id" TEXT,
    "opportunity_id" TEXT,
    "vehicle_id" TEXT,
    "auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leads_tenant_id_status_idx" ON "leads"("tenant_id", "status");

-- CreateIndex
CREATE INDEX "leads_tenant_id_seller_id_status_idx" ON "leads"("tenant_id", "seller_id", "status");

-- CreateIndex
CREATE INDEX "leads_tenant_id_next_follow_up_at_idx" ON "leads"("tenant_id", "next_follow_up_at");

-- CreateIndex
CREATE UNIQUE INDEX "lead_vehicle_interests_lead_id_vehicle_id_key" ON "lead_vehicle_interests"("lead_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "lead_vehicle_interests_tenant_id_vehicle_id_idx" ON "lead_vehicle_interests"("tenant_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "lead_contacts_tenant_id_lead_id_contacted_at_idx" ON "lead_contacts"("tenant_id", "lead_id", "contacted_at");

-- CreateIndex
CREATE INDEX "seller_reminders_tenant_id_user_id_status_due_at_idx" ON "seller_reminders"("tenant_id", "user_id", "status", "due_at");

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_vehicle_interests" ADD CONSTRAINT "lead_vehicle_interests_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_vehicle_interests" ADD CONSTRAINT "lead_vehicle_interests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_contacts" ADD CONSTRAINT "lead_contacts_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lead_contacts" ADD CONSTRAINT "lead_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_reminders" ADD CONSTRAINT "seller_reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_reminders" ADD CONSTRAINT "seller_reminders_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_reminders" ADD CONSTRAINT "seller_reminders_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
