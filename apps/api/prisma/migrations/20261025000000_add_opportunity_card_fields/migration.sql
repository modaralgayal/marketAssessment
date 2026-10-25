/*
  Migration: add structured offer fields to OpportunityCard.

  Mirrors the opportunity-card model prototype (partner type, timing, objective,
  initial order / MOQ, payment, delivery, rights, valid until, launch support,
  catalogue references, commercial attachments, and a version counter).

  Additive only — no existing columns, data, or tables are dropped.
*/

-- CreateTable-style column additions on OpportunityCard
-- Idempotent so re-applying (e.g. after a migration-history reset) is safe.
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "partner" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "timing" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "objective" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "moq" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "payment" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "delivery" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "rights" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "validUntil" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "support" TEXT;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "sources" JSONB;
ALTER TABLE "OpportunityCard" ADD COLUMN IF NOT EXISTS "assets" JSONB;
