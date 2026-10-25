/*
  Migration: let ManufacturerFile represent both uploaded PDFs and external links.

  - `kind` "pdf" (uploaded, storageKey set) | "link" (external url set).
  - `storageKey` becomes optional (links have none).
  - `url` holds the external link for kind = "link".

  Additive / non-destructive — existing rows keep their storageKey and default to kind "pdf".
*/

-- Idempotent so re-applying (e.g. after a migration-history reset) is safe.
ALTER TABLE "ManufacturerFile" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'pdf';
ALTER TABLE "ManufacturerFile" ADD COLUMN IF NOT EXISTS "url" TEXT;
ALTER TABLE "ManufacturerFile" ALTER COLUMN "storageKey" DROP NOT NULL;
