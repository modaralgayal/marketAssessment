/*
  Warnings:

  - Made the column `contactTitle` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `contactTitle` on table `Submission` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OpportunityInteractionStatus" AS ENUM ('NEW', 'VIEWED', 'SAVED', 'INTERESTED', 'DECLINED', 'REFERRED');

-- CreateEnum
CREATE TYPE "SourcingInquiryStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "privacyAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "privacyAcceptedVersion" INTEGER;

-- AlterTable
ALTER TABLE "BuyerProfile" ADD COLUMN     "assortmentPlan" TEXT,
ADD COLUMN     "channelBasis" TEXT,
ADD COLUMN     "channelPercentages" JSONB,
ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "details" JSONB,
ADD COLUMN     "directImportPercent" DOUBLE PRECISION,
ADD COLUMN     "distributionGeography" TEXT,
ADD COLUMN     "distributionProductType" TEXT,
ADD COLUMN     "distributionRole" TEXT,
ADD COLUMN     "expandPortfolio" TEXT,
ADD COLUMN     "expansionProducts" TEXT,
ADD COLUMN     "hqCity" TEXT,
ADD COLUMN     "hqCountry" TEXT,
ADD COLUMN     "localSupplierPercent" DOUBLE PRECISION,
ADD COLUMN     "operatingCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "portfolioProducts" TEXT,
ADD COLUMN     "privateLabel" TEXT,
ADD COLUMN     "privateLabelCategories" TEXT,
ADD COLUMN     "privateLabelName" TEXT,
ADD COLUMN     "purchasingOffice" TEXT,
ADD COLUMN     "purchasingOutsourced" TEXT,
ADD COLUMN     "purchasingStructure" TEXT,
ADD COLUMN     "purchasingSubsidiary" TEXT,
ADD COLUMN     "purchasingSubsidiaryName" TEXT,
ADD COLUMN     "retailDelivery" TEXT,
ADD COLUMN     "retailExpansionProducts" TEXT,
ADD COLUMN     "retailFormats" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "retailGeography" TEXT,
ADD COLUMN     "retailMixBasis" TEXT,
ADD COLUMN     "retailProductType" TEXT,
ADD COLUMN     "retailSupply" TEXT,
ADD COLUMN     "roles" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "salesPoints" INTEGER,
ADD COLUMN     "salesReachMode" TEXT,
ADD COLUMN     "storage" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "storeCount" INTEGER,
ADD COLUMN     "tradingName" TEXT,
ADD COLUMN     "vehicleArrangement" TEXT,
ADD COLUMN     "vehicles" TEXT,
ADD COLUMN     "warehouse" TEXT,
ADD COLUMN     "warehouseArrangement" TEXT;

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "contactTitle" SET NOT NULL;

-- AlterTable
ALTER TABLE "ManufacturerProfile" ADD COLUMN     "branding" TEXT,
ADD COLUMN     "catalogueCoverage" JSONB,
ADD COLUMN     "certs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "exportCount" INTEGER,
ADD COLUMN     "knownFor" TEXT,
ADD COLUMN     "logistics" TEXT,
ADD COLUMN     "pictures" TEXT,
ADD COLUMN     "privateLabel" TEXT,
ADD COLUMN     "topMarkets" TEXT,
ADD COLUMN     "usp" TEXT;

-- AlterTable
ALTER TABLE "OpportunityCard" ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "territory" TEXT;

-- AlterTable
ALTER TABLE "Submission" ALTER COLUMN "contactTitle" SET NOT NULL;

-- CreateTable
CREATE TABLE "PrivacyPolicyVersion" (
    "id" SERIAL NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyPolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityInteraction" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "status" "OpportunityInteractionStatus" NOT NULL DEFAULT 'NEW',
    "viewedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "linkedInquiryId" TEXT,
    "referralNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunityInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "actorAccountId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerFile" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcingInquiry" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "market" TEXT,
    "channels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priceTier" TEXT,
    "targetPrice" TEXT,
    "timeframe" TEXT,
    "quantity" TEXT,
    "essential" TEXT,
    "negotiable" TEXT,
    "status" "SourcingInquiryStatus" NOT NULL DEFAULT 'DRAFT',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourcingInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourcingInquiryFile" (
    "id" TEXT NOT NULL,
    "inquiryId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourcingInquiryFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicyVersion_version_key" ON "PrivacyPolicyVersion"("version");

-- CreateIndex
CREATE INDEX "PrivacyPolicyVersion_version_idx" ON "PrivacyPolicyVersion"("version");

-- CreateIndex
CREATE INDEX "OpportunityInteraction_cardId_idx" ON "OpportunityInteraction"("cardId");

-- CreateIndex
CREATE INDEX "OpportunityInteraction_accountId_idx" ON "OpportunityInteraction"("accountId");

-- CreateIndex
CREATE INDEX "OpportunityInteraction_status_idx" ON "OpportunityInteraction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OpportunityInteraction_cardId_accountId_key" ON "OpportunityInteraction"("cardId", "accountId");

-- CreateIndex
CREATE INDEX "ActivityEvent_accountId_createdAt_idx" ON "ActivityEvent"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "BuyerFile_buyerProfileId_idx" ON "BuyerFile"("buyerProfileId");

-- CreateIndex
CREATE INDEX "SourcingInquiry_accountId_idx" ON "SourcingInquiry"("accountId");

-- CreateIndex
CREATE INDEX "SourcingInquiry_status_idx" ON "SourcingInquiry"("status");

-- CreateIndex
CREATE INDEX "SourcingInquiry_market_idx" ON "SourcingInquiry"("market");

-- CreateIndex
CREATE INDEX "SourcingInquiryFile_inquiryId_idx" ON "SourcingInquiryFile"("inquiryId");

-- CreateIndex
CREATE INDEX "Invite_token_idx" ON "Invite"("token");

-- AddForeignKey
ALTER TABLE "OpportunityInteraction" ADD CONSTRAINT "OpportunityInteraction_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "OpportunityCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityInteraction" ADD CONSTRAINT "OpportunityInteraction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerFile" ADD CONSTRAINT "BuyerFile_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingInquiry" ADD CONSTRAINT "SourcingInquiry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourcingInquiryFile" ADD CONSTRAINT "SourcingInquiryFile_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "SourcingInquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
