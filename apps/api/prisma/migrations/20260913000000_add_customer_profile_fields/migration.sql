-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "logoFileId" TEXT;

ALTER TABLE "Customer" ADD COLUMN "contacts" JSONB;

ALTER TABLE "Customer" ADD COLUMN "productCategory" TEXT;

ALTER TABLE "Customer" ADD COLUMN "companyInfo" TEXT;

ALTER TABLE "Customer" ADD COLUMN "dataPool" JSONB;
