/*
  Migration: sync_framework_v2

  Brings the database in line with the v2.0 GCC Market Entry framework:

  - RevenueBracket: removes UNDER_1M / OVER_100M (rows holding those values are
    cleared to NULL first, since the column is nullable and data loss in these
    legacy buckets is accepted).
  - Adds enums: FrozenStorage, ShelfLife, BrandApproach, TargetPotential.
  - Converts shelfLife TEXT -> ShelfLife enum (incompatible free-text cleared to NULL).
  - Drops obsolete columns (productNames, numberOfSkus, exWorksPriceRange,
    targetMarkets, timeline, revenueYear1Target, revenueYear3Target, gccContact,
    gccContactDetails, distributionPartner, distributionDetails, budget,
    partnershipHorizon, brandActivation, hasSigningAuthority, signingAuthorityContact)
    from Submission and Customer.
  - Adds new framework columns to Submission and Customer.
  - Drops obsolete enums Timeline, BudgetBracket, Horizon, Activation.
*/

-- 1. Clear enum values that no longer exist in RevenueBracket (cast would fail otherwise)
UPDATE "Submission" SET "annualRevenue" = NULL WHERE "annualRevenue"::text IN ('UNDER_1M', 'OVER_100M');
UPDATE "Customer" SET "annualRevenue" = NULL WHERE "annualRevenue"::text IN ('UNDER_1M', 'OVER_100M');

-- 2. Recreate RevenueBracket without UNDER_1M / OVER_100M
ALTER TYPE "RevenueBracket" RENAME TO "RevenueBracket_old";

CREATE TYPE "RevenueBracket" AS ENUM ('R1_5M', 'R5_20M', 'R20_50M', 'R50_100M', 'R100_200M', 'R200M_PLUS', 'R300M_PLUS', 'R400M_PLUS', 'R500M_1B', 'R1B_PLUS', 'CUSTOM');

ALTER TABLE "Submission" ALTER COLUMN "annualRevenue" TYPE "RevenueBracket" USING ("annualRevenue"::text::"RevenueBracket");
ALTER TABLE "Customer" ALTER COLUMN "annualRevenue" TYPE "RevenueBracket" USING ("annualRevenue"::text::"RevenueBracket");

DROP TYPE "RevenueBracket_old";

-- 3. Create new enums introduced by the v2 framework
CREATE TYPE "FrozenStorage" AS ENUM ('YES', 'NO');
CREATE TYPE "ShelfLife" AS ENUM ('SHORT', 'MEDIUM', 'LONG');
CREATE TYPE "BrandApproach" AS ENUM ('BRAND_LED', 'SHARED', 'TRADE_SUPPORT', 'PRICE_LED');
CREATE TYPE "TargetPotential" AS ENUM ('KSA', 'UAE', 'BOTH', 'UNSURE', 'OTHER');

-- 4. Convert shelfLife TEXT -> ShelfLife enum (clear incompatible free-text first)
UPDATE "Submission" SET "shelfLife" = NULL WHERE "shelfLife" IS NOT NULL AND "shelfLife" NOT IN ('SHORT', 'MEDIUM', 'LONG');
ALTER TABLE "Submission" ALTER COLUMN "shelfLife" TYPE "ShelfLife" USING ("shelfLife"::text::"ShelfLife");

UPDATE "Customer" SET "shelfLife" = NULL WHERE "shelfLife" IS NOT NULL AND "shelfLife" NOT IN ('SHORT', 'MEDIUM', 'LONG');
ALTER TABLE "Customer" ALTER COLUMN "shelfLife" TYPE "ShelfLife" USING ("shelfLife"::text::"ShelfLife");

-- 5. Drop obsolete columns from Submission
ALTER TABLE "Submission"
  DROP COLUMN "productNames",
  DROP COLUMN "numberOfSkus",
  DROP COLUMN "exWorksPriceRange",
  DROP COLUMN "targetMarkets",
  DROP COLUMN "timeline",
  DROP COLUMN "revenueYear1Target",
  DROP COLUMN "revenueYear3Target",
  DROP COLUMN "gccContact",
  DROP COLUMN "gccContactDetails",
  DROP COLUMN "distributionPartner",
  DROP COLUMN "distributionDetails",
  DROP COLUMN "budget",
  DROP COLUMN "partnershipHorizon",
  DROP COLUMN "brandActivation",
  DROP COLUMN "hasSigningAuthority",
  DROP COLUMN "signingAuthorityContact";

-- 5b. Drop obsolete columns from Customer
ALTER TABLE "Customer"
  DROP COLUMN "productNames",
  DROP COLUMN "numberOfSkus",
  DROP COLUMN "exWorksPriceRange",
  DROP COLUMN "targetMarkets",
  DROP COLUMN "timeline",
  DROP COLUMN "revenueYear1Target",
  DROP COLUMN "revenueYear3Target",
  DROP COLUMN "gccContact",
  DROP COLUMN "gccContactDetails",
  DROP COLUMN "distributionPartner",
  DROP COLUMN "distributionDetails",
  DROP COLUMN "budget",
  DROP COLUMN "partnershipHorizon",
  DROP COLUMN "brandActivation",
  DROP COLUMN "hasSigningAuthority",
  DROP COLUMN "signingAuthorityContact";

-- 6. Add new framework columns to Submission
ALTER TABLE "Submission"
  ADD COLUMN "frozenStorage" "FrozenStorage",
  ADD COLUMN "otherCertsCustom" TEXT,
  ADD COLUMN "gccCurrentlyActive" BOOLEAN,
  ADD COLUMN "currentGccMarkets" TEXT[],
  ADD COLUMN "gccSituation" TEXT,
  ADD COLUMN "targetMarketPotential" "TargetPotential",
  ADD COLUMN "targetMarketPotentialOther" TEXT,
  ADD COLUMN "channelStrategy" TEXT,
  ADD COLUMN "brandApproach" "BrandApproach",
  ADD COLUMN "leadTimes" TEXT;

-- 6b. Add new framework columns to Customer
ALTER TABLE "Customer"
  ADD COLUMN "frozenStorage" "FrozenStorage",
  ADD COLUMN "otherCertsCustom" TEXT,
  ADD COLUMN "gccCurrentlyActive" BOOLEAN,
  ADD COLUMN "currentGccMarkets" TEXT[],
  ADD COLUMN "gccSituation" TEXT,
  ADD COLUMN "targetMarketPotential" "TargetPotential",
  ADD COLUMN "targetMarketPotentialOther" TEXT,
  ADD COLUMN "channelStrategy" TEXT,
  ADD COLUMN "brandApproach" "BrandApproach",
  ADD COLUMN "leadTimes" TEXT;

-- 7. Drop obsolete enums (no longer referenced after column drops)
DROP TYPE "Timeline";
DROP TYPE "BudgetBracket";
DROP TYPE "Horizon";
DROP TYPE "Activation";
