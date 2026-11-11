-- Allow admin-wide activity notifications (accountId null).
ALTER TABLE "ActivityEvent" ALTER COLUMN "accountId" DROP NOT NULL;
