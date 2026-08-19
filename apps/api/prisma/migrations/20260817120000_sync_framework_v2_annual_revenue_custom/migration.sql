-- Add the annualRevenueCustom column to Submission and Customer.
-- The v2 framework migration (20260817000000_sync_framework_v2) omitted this
-- column even though the schema defines it. Kept as a standalone migration so
-- the already-applied v2 migration's checksum stays stable.
ALTER TABLE "Submission" ADD COLUMN "annualRevenueCustom" TEXT;
ALTER TABLE "Customer" ADD COLUMN "annualRevenueCustom" TEXT;