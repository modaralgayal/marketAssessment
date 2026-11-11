-- Add publicDescription to manufacturer + buyer profiles (buyer-visible profile blurb).
ALTER TABLE "ManufacturerProfile" ADD COLUMN "publicDescription" TEXT;
ALTER TABLE "BuyerProfile" ADD COLUMN "publicDescription" TEXT;
