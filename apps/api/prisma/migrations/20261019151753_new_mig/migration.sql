-- AlterTable
ALTER TABLE "ManufacturerProfile" ADD COLUMN     "catalogueFileId" TEXT;

-- CreateTable
CREATE TABLE "ManufacturerFile" (
    "id" TEXT NOT NULL,
    "manufacturerProfileId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturerFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManufacturerFile_manufacturerProfileId_idx" ON "ManufacturerFile"("manufacturerProfileId");

-- AddForeignKey
ALTER TABLE "ManufacturerFile" ADD CONSTRAINT "ManufacturerFile_manufacturerProfileId_fkey" FOREIGN KEY ("manufacturerProfileId") REFERENCES "ManufacturerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
