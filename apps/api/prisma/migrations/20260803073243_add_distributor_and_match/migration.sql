-- CreateTable
CREATE TABLE "Distributor" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "cityRegion" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "sizeScale" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "contactPerson" TEXT,
    "doWeKnowThem" TEXT,
    "statusLastContact" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Distributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManufacturerMatch" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "distributorId" TEXT NOT NULL,
    "compatibilityScore" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT NOT NULL,
    "matchLevel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManufacturerMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManufacturerMatch_submissionId_idx" ON "ManufacturerMatch"("submissionId");

-- CreateIndex
CREATE INDEX "ManufacturerMatch_distributorId_idx" ON "ManufacturerMatch"("distributorId");

-- AddForeignKey
ALTER TABLE "ManufacturerMatch" ADD CONSTRAINT "ManufacturerMatch_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManufacturerMatch" ADD CONSTRAINT "ManufacturerMatch_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
