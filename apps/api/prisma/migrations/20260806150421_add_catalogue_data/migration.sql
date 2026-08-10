-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "catalogueData" JSONB,
ADD COLUMN     "catalogueExtractedAt" TIMESTAMP(3);
