-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('BUYER', 'MANUFACTURER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "OpportunitySide" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "OpportunityStatus" AS ENUM ('DRAFT', 'POSTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MatchSuggestionStatus" AS ENUM ('NEW', 'REVIEWED', 'DISMISSED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "BuyerType" AS ENUM ('IMPORTER_DISTRIBUTOR', 'RETAILER');

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "accountId" TEXT,
ADD COLUMN     "role" TEXT;

-- AlterTable
ALTER TABLE "ReportRequest" ADD COLUMN     "consent" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Account" (
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

-- CreateTable
CREATE TABLE "OpportunityCard" (
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

-- CreateTable
CREATE TABLE "MatchSuggestion" (
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

-- CreateTable
CREATE TABLE "ManufacturerProfile" (
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
    "otherCerts" TEXT[],
    "otherCertsCustom" TEXT,
    "labelLanguages" TEXT,
    "productAdaptability" "Adaptability",
    "brandApproach" "BrandApproach",
    "leadTimes" TEXT,
    "gccCurrentlyActive" BOOLEAN,
    "currentGccMarkets" TEXT[],
    "gccSituation" TEXT,
    "targetMarketPotential" "TargetPotential",
    "targetMarketPotentialOther" TEXT,
    "salesChannels" TEXT[],
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

-- CreateTable
CREATE TABLE "BuyerProfile" (
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

-- CreateIndex
CREATE UNIQUE INDEX "Account_firebaseUid_key" ON "Account"("firebaseUid");

-- CreateIndex
CREATE INDEX "Account_firebaseUid_idx" ON "Account"("firebaseUid");

-- CreateIndex
CREATE INDEX "Account_role_idx" ON "Account"("role");

-- CreateIndex
CREATE INDEX "OpportunityCard_ownerAccountId_idx" ON "OpportunityCard"("ownerAccountId");

-- CreateIndex
CREATE INDEX "OpportunityCard_status_idx" ON "OpportunityCard"("status");

-- CreateIndex
CREATE INDEX "OpportunityCard_side_idx" ON "OpportunityCard"("side");

-- CreateIndex
CREATE INDEX "MatchSuggestion_cardAId_idx" ON "MatchSuggestion"("cardAId");

-- CreateIndex
CREATE INDEX "MatchSuggestion_cardBId_idx" ON "MatchSuggestion"("cardBId");

-- CreateIndex
CREATE UNIQUE INDEX "ManufacturerProfile_accountId_key" ON "ManufacturerProfile"("accountId");

-- CreateIndex
CREATE INDEX "ManufacturerProfile_accountId_idx" ON "ManufacturerProfile"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_accountId_key" ON "BuyerProfile"("accountId");

-- CreateIndex
CREATE INDEX "BuyerProfile_accountId_idx" ON "BuyerProfile"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_accountId_key" ON "Invite"("accountId");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityCard" ADD CONSTRAINT "OpportunityCard_ownerAccountId_fkey" FOREIGN KEY ("ownerAccountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_cardAId_fkey" FOREIGN KEY ("cardAId") REFERENCES "OpportunityCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchSuggestion" ADD CONSTRAINT "MatchSuggestion_cardBId_fkey" FOREIGN KEY ("cardBId") REFERENCES "OpportunityCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerProfile" ADD CONSTRAINT "ManufacturerProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerProfile" ADD CONSTRAINT "BuyerProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

