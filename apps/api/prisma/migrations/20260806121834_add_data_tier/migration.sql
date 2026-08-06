-- AlterTable
ALTER TABLE "Distributor" ADD COLUMN     "attributes" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "dataTier" INTEGER NOT NULL DEFAULT 3;

-- CreateIndex
CREATE INDEX "Distributor_dataTier_idx" ON "Distributor"("dataTier");
