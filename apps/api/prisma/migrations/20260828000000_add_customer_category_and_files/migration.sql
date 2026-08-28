-- CreateEnum
CREATE TYPE "CustomerCategory" AS ENUM ('CUSTOMER', 'POTENTIAL', 'OTHER');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "category" "CustomerCategory" NOT NULL DEFAULT 'POTENTIAL';

-- CreateTable
CREATE TABLE "CustomerFile" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerFile_customerId_idx" ON "CustomerFile"("customerId");

-- CreateIndex
CREATE INDEX "Customer_category_idx" ON "Customer"("category");

-- AddForeignKey
ALTER TABLE "CustomerFile" ADD CONSTRAINT "CustomerFile_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'OPPORTUNITY';
