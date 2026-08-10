/*
  Warnings:

  - Added the required column `industryCategory` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productNames` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "annualRevenue" "RevenueBracket",
ADD COLUMN     "anythingElse" TEXT,
ADD COLUMN     "brandActivation" "Activation",
ADD COLUMN     "budget" "BudgetBracket",
ADD COLUMN     "contactTitle" TEXT,
ADD COLUMN     "currentExportMarkets" TEXT,
ADD COLUMN     "distributionDetails" TEXT,
ADD COLUMN     "distributionPartner" BOOLEAN,
ADD COLUMN     "exWorksPriceRange" TEXT,
ADD COLUMN     "exportContact" BOOLEAN,
ADD COLUMN     "gccContact" BOOLEAN,
ADD COLUMN     "gccContactDetails" TEXT,
ADD COLUMN     "halalCert" "YesNoUnsure",
ADD COLUMN     "hasSigningAuthority" BOOLEAN,
ADD COLUMN     "industryCategory" TEXT NOT NULL,
ADD COLUMN     "labelLanguages" TEXT,
ADD COLUMN     "moq" TEXT,
ADD COLUMN     "numberOfSkus" TEXT,
ADD COLUMN     "otherCerts" TEXT[],
ADD COLUMN     "partnershipHorizon" "Horizon",
ADD COLUMN     "productAdaptability" "Adaptability",
ADD COLUMN     "productNames" TEXT NOT NULL,
ADD COLUMN     "productionCapacity" "Capacity",
ADD COLUMN     "revenueYear1Target" TEXT,
ADD COLUMN     "revenueYear3Target" TEXT,
ADD COLUMN     "salesChannels" TEXT[],
ADD COLUMN     "sfdaStatus" "SfdaStatus",
ADD COLUMN     "shelfLife" TEXT,
ADD COLUMN     "signingAuthorityContact" TEXT,
ADD COLUMN     "targetMarkets" TEXT[],
ADD COLUMN     "timeline" "Timeline",
ADD COLUMN     "website" TEXT,
ADD COLUMN     "yearsInBusiness" TEXT;
