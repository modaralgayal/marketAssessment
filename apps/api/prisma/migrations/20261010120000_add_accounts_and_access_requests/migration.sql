-- Additive migration: the public access-request queue.
--
-- Everything else this migration references (Account / ManufacturerProfile /
-- BuyerProfile / OpportunityCard / MatchSuggestion tables, their enums, and the
-- foreign keys) was already created by an earlier migration
-- (20261007193131_add_accounts_and_opportunity_cards) which the prod DB was
-- built from. This migration therefore only adds what is genuinely new —
-- the AccessRequest table and its AccessRequestStatus enum — and guards every
-- statement with IF NOT EXISTS so a re-run is a safe no-op.
--
-- NEVER run `prisma migrate dev` here — only `prisma migrate deploy`, which
-- never drops data.

-- ── Enums (idempotent) ─────────────────────────────────────────────────────
-- AccountRole / AccountStatus / BuyerType / OpportunitySide / OpportunityStatus
-- / MatchSuggestionStatus already exist on prod (from 20261007193131). Only the
-- access-request status enum is new. `CREATE TYPE` does not accept IF NOT EXISTS
-- on this PostgreSQL version, so guard it with a DO block instead.
DO $$ BEGIN
  CREATE TYPE "AccessRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Account (idempotent — already exists on prod) ───────────────────────────
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "AccountRole" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "inviteToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Account_firebaseUid_key" ON "Account"("firebaseUid");
CREATE INDEX IF NOT EXISTS "Account_role_idx" ON "Account"("role");

-- ── ManufacturerProfile (idempotent — already exists on prod) ──────────────
CREATE TABLE IF NOT EXISTS "ManufacturerProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "industryCategory" TEXT NOT NULL,
    "annualRevenue" "RevenueBracket",
    "annualRevenueCustom" TEXT,
    "yearsInBusiness" TEXT,
    "currentExportMarkets" TEXT,
    "halalCert" "YesNoUnsure",
    "sfdaStatus" "SfdaStatus",
    "frozenStorage" "FrozenStorage",
    "shelfLife" "ShelfLife",
    "otherCerts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "otherCertsCustom" TEXT,
    "labelLanguages" TEXT,
    "productAdaptability" "Adaptability",
    "brandApproach" "BrandApproach",
    "leadTimes" TEXT,
    "gccCurrentlyActive" BOOLEAN,
    "currentGccMarkets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gccSituation" TEXT,
    "targetMarketPotential" "TargetPotential",
    "targetMarketPotentialOther" TEXT,
    "salesChannels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "channelStrategy" TEXT,
    "moq" TEXT,
    "exportContact" BOOLEAN,
    "productionCapacity" "Capacity",
    "contactFullName" TEXT NOT NULL,
    "contactTitle" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "anythingElse" TEXT,
    "contacts" JSONB,
    "productCategory" TEXT,
    "companyInfo" TEXT,
    "logoFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManufacturerProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ManufacturerProfile_accountId_key" ON "ManufacturerProfile"("accountId");
CREATE INDEX IF NOT EXISTS "ManufacturerProfile_accountId_idx" ON "ManufacturerProfile"("accountId");

-- ── BuyerProfile (idempotent — already exists on prod) ─────────────────────
CREATE TABLE IF NOT EXISTS "BuyerProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "buyerType" "BuyerType" NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "portfolioInfo" TEXT,
    "sourcingNeeds" TEXT,
    "targetMarkets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contactFullName" TEXT NOT NULL,
    "contactTitle" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "contacts" JSONB,
    "logoFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "BuyerProfile_accountId_key" ON "BuyerProfile"("accountId");
CREATE INDEX IF NOT EXISTS "BuyerProfile_accountId_idx" ON "BuyerProfile"("accountId");

-- ── OpportunityCard (idempotent — already exists on prod) ──────────────────
CREATE TABLE IF NOT EXISTS "OpportunityCard" (
    "id" TEXT NOT NULL,
    "ownerAccountId" TEXT NOT NULL,
    "side" "OpportunitySide" NOT NULL,
    "status" "OpportunityStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "category" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityCard_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OpportunityCard_ownerAccountId_idx" ON "OpportunityCard"("ownerAccountId");
CREATE INDEX IF NOT EXISTS "OpportunityCard_status_idx" ON "OpportunityCard"("status");
CREATE INDEX IF NOT EXISTS "OpportunityCard_side_idx" ON "OpportunityCard"("side");

-- ── MatchSuggestion (idempotent — already exists on prod) ──────────────────
CREATE TABLE IF NOT EXISTS "MatchSuggestion" (
    "id" TEXT NOT NULL,
    "cardAId" TEXT NOT NULL,
    "cardBId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT,
    "status" "MatchSuggestionStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchSuggestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MatchSuggestion_cardAId_idx" ON "MatchSuggestion"("cardAId");
CREATE INDEX IF NOT EXISTS "MatchSuggestion_cardBId_idx" ON "MatchSuggestion"("cardBId");

-- ── AccessRequest (the genuinely new table) ───────────────────────────────
CREATE TABLE IF NOT EXISTS "AccessRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "intendedRole" "AccountRole" NOT NULL,
    "message" TEXT,
    "status" "AccessRequestStatus" NOT NULL DEFAULT 'PENDING',
    "inviteToken" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AccessRequest_status_idx" ON "AccessRequest"("status");
CREATE INDEX IF NOT EXISTS "AccessRequest_email_idx" ON "AccessRequest"("email");

-- ── Invite extension (additive columns on the pre-existing Invite table) ────
ALTER TABLE "Invite" ADD COLUMN IF NOT EXISTS "role" TEXT;
ALTER TABLE "Invite" ADD COLUMN IF NOT EXISTS "accountId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Invite_accountId_key" ON "Invite"("accountId");
-- The foreign key Invite_accountId_fkey already exists (created by
-- 20261007193131_add_accounts_and_opportunity_cards), so it is intentionally
-- NOT re-declared here.
