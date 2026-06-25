-- CreateEnum
CREATE TYPE "RevenueBracket" AS ENUM ('UNDER_1M', 'R1_5M', 'R5_20M', 'R20_50M', 'R50_100M', 'OVER_100M');

-- CreateEnum
CREATE TYPE "YesNoUnsure" AS ENUM ('YES', 'IN_PROGRESS', 'NO', 'UNSURE');

-- CreateEnum
CREATE TYPE "Timeline" AS ENUM ('ASAP', 'WITHIN_6M', 'WITHIN_12M', 'OVER_12M');

-- CreateEnum
CREATE TYPE "Capacity" AS ENUM ('YES', 'PARTIAL', 'NO');

-- CreateEnum
CREATE TYPE "Adaptability" AS ENUM ('YES', 'PARTIAL', 'NO');

-- CreateEnum
CREATE TYPE "BudgetBracket" AS ENUM ('NONE', 'UNDER_10K', 'B10_30K', 'B30_60K', 'OVER_60K');

-- CreateEnum
CREATE TYPE "Horizon" AS ENUM ('LONG_TERM', 'TRANSACTIONAL');

-- CreateEnum
CREATE TYPE "Activation" AS ENUM ('YES', 'DISCUSS', 'NO');

-- CreateEnum
CREATE TYPE "SfdaStatus" AS ENUM ('REGISTERED', 'IN_PROCESS', 'NOT_YET', 'UNSURE');

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "website" TEXT,
    "industryCategory" TEXT NOT NULL,
    "annualRevenue" "RevenueBracket",
    "yearsInBusiness" TEXT,
    "currentExportMarkets" TEXT,
    "productNames" TEXT NOT NULL,
    "numberOfSkus" TEXT,
    "shelfLife" TEXT,
    "exWorksPriceRange" TEXT,
    "halalCert" "YesNoUnsure",
    "otherCerts" TEXT[],
    "labelLanguages" TEXT,
    "targetMarkets" TEXT[],
    "salesChannels" TEXT[],
    "timeline" "Timeline",
    "revenueYear1Target" TEXT,
    "revenueYear3Target" TEXT,
    "gccContact" BOOLEAN,
    "gccContactDetails" TEXT,
    "distributionPartner" BOOLEAN,
    "distributionDetails" TEXT,
    "moq" TEXT,
    "exportContact" BOOLEAN,
    "productionCapacity" "Capacity",
    "sfdaStatus" "SfdaStatus",
    "productAdaptability" "Adaptability",
    "budget" "BudgetBracket",
    "partnershipHorizon" "Horizon",
    "brandActivation" "Activation",
    "contactFullName" TEXT NOT NULL,
    "contactTitle" TEXT,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "hasSigningAuthority" BOOLEAN,
    "signingAuthorityContact" TEXT,
    "anythingElse" TEXT,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubmissionFile" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Submission_createdAt_idx" ON "Submission"("createdAt");

-- CreateIndex
CREATE INDEX "Submission_contactEmail_idx" ON "Submission"("contactEmail");

-- CreateIndex
CREATE INDEX "SubmissionFile_submissionId_idx" ON "SubmissionFile"("submissionId");

-- AddForeignKey
ALTER TABLE "SubmissionFile" ADD CONSTRAINT "SubmissionFile_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
