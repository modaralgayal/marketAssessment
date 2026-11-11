-- Loosen the manufacturer-profile enum columns to free text so the profile form can
-- store the reference-prototype option values (the Submission table keeps its enums).
ALTER TABLE "ManufacturerProfile" ALTER COLUMN "annualRevenue" TYPE TEXT USING "annualRevenue"::text;
ALTER TABLE "ManufacturerProfile" ALTER COLUMN "frozenStorage" TYPE TEXT USING "frozenStorage"::text;
ALTER TABLE "ManufacturerProfile" ALTER COLUMN "productAdaptability" TYPE TEXT USING "productAdaptability"::text;
ALTER TABLE "ManufacturerProfile" ALTER COLUMN "brandApproach" TYPE TEXT USING "brandApproach"::text;
ALTER TABLE "ManufacturerProfile" ALTER COLUMN "productionCapacity" TYPE TEXT USING "productionCapacity"::text;
