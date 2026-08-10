-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('QUALIFYING', 'ACTIVE', 'INACTIVE', 'WON', 'LOST');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactFullName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "onboardingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "customerStatus" "CustomerStatus" NOT NULL DEFAULT 'QUALIFYING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_submissionId_key" ON "Customer"("submissionId");

-- CreateIndex
CREATE INDEX "Customer_createdAt_idx" ON "Customer"("createdAt");

-- CreateIndex
CREATE INDEX "Customer_customerStatus_idx" ON "Customer"("customerStatus");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
