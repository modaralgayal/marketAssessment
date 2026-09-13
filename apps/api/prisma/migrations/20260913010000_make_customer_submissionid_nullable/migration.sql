-- AlterTable
-- The schema declares `submissionId` as optional (String?), but the original
-- migration created it NOT NULL. Profile-created customers (and the direct
-- customer create path) have no submission, so we drop the NOT NULL constraint
-- to align the database with the schema.
ALTER TABLE "Customer" ALTER COLUMN "submissionId" DROP NOT NULL;
