/*
  Warnings:

  - You are about to drop the column `printProfileId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the `PrintProfile` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Finish` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_printProfileId_fkey";

-- AlterTable
ALTER TABLE "Finish" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "printProductionProfileId" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "printProfileId";

-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "printProductionProfileId" TEXT;

-- DropTable
DROP TABLE "PrintProfile";

-- CreateTable
CREATE TABLE "PrintProductionProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "minWidth" DOUBLE PRECISION NOT NULL,
    "maxWidth" DOUBLE PRECISION NOT NULL,
    "minHeight" DOUBLE PRECISION NOT NULL,
    "maxHeight" DOUBLE PRECISION NOT NULL,
    "allowKissCut" BOOLEAN NOT NULL DEFAULT false,
    "allowDieCut" BOOLEAN NOT NULL DEFAULT false,
    "laminationId" TEXT,
    "wastePercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "setupCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintProductionProfile_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PrintProductionProfile" ADD CONSTRAINT "PrintProductionProfile_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintProductionProfile" ADD CONSTRAINT "PrintProductionProfile_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintProductionProfile" ADD CONSTRAINT "PrintProductionProfile_laminationId_fkey" FOREIGN KEY ("laminationId") REFERENCES "Finish"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItem" ADD CONSTRAINT "QuoteItem_printProductionProfileId_fkey" FOREIGN KEY ("printProductionProfileId") REFERENCES "PrintProductionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_printProductionProfileId_fkey" FOREIGN KEY ("printProductionProfileId") REFERENCES "PrintProductionProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
