-- Add the reference-prototype "Target export market" + "Export contact details" fields.
ALTER TABLE "ManufacturerProfile" ADD COLUMN "targetExportMarket" TEXT;
ALTER TABLE "ManufacturerProfile" ADD COLUMN "exportContactDetails" TEXT;
