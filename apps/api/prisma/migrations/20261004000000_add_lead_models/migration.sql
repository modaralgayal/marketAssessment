-- CreateEnum
CREATE TYPE "LeadKind" AS ENUM ('EXPORTING', 'SOURCING', 'ORGANIZATION');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "kind" "LeadKind" NOT NULL,
    "sourcePage" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "companyName" TEXT,
    "country" TEXT,
    "website" TEXT,
    "product" TEXT,
    "targetMarket" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "organizationName" TEXT,
    "organizationType" TEXT,
    "jobTitle" TEXT,
    "support" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "priorities" TEXT,
    "sourceCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "products" TEXT,
    "details" TEXT,
    "productDocumentLink" TEXT,
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadFile" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_kind_idx" ON "Lead"("kind");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "LeadFile_leadId_idx" ON "LeadFile"("leadId");

-- AddForeignKey
ALTER TABLE "LeadFile" ADD CONSTRAINT "LeadFile_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
