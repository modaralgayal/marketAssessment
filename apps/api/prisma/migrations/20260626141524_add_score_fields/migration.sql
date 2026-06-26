/*
  Warnings:

  - Added the required column `updatedAt` to the `Submission` table without a default value. This is not possible if the table is not empty.

  Manual fix: Set existing rows' updatedAt to their createdAt value.
*/
-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "decision" TEXT,
ADD COLUMN     "evaluatedAt" TIMESTAMP(3),
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing rows to set updatedEqual to createdAt (since we don't have update history)
UPDATE "Submission" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- CreateIndex
CREATE INDEX "Submission_evaluatedAt_idx" ON "Submission"("evaluatedAt");