/*
  Warnings:

  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "price",
ADD COLUMN     "pricingMode" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "printProfileId" TEXT;

-- CreateTable
CREATE TABLE "PrintProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricingMode" TEXT NOT NULL,
    "allowedMaterials" JSONB NOT NULL,
    "defaultProcesses" JSONB NOT NULL,
    "allowedFinishes" JSONB NOT NULL,
    "notes" TEXT,

    CONSTRAINT "PrintProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "rollWidthIn" DOUBLE PRECISION,
    "rollLengthFt" DOUBLE PRECISION,
    "sheetWidthIn" DOUBLE PRECISION,
    "sheetHeightIn" DOUBLE PRECISION,
    "rollCost" DOUBLE PRECISION NOT NULL,
    "wastePercent" DOUBLE PRECISION NOT NULL,
    "costPerSqft" DOUBLE PRECISION NOT NULL,
    "sellPerSqft" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "costPerSqft" DOUBLE PRECISION NOT NULL,
    "sellPerSqft" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finish" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Finish_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_printProfileId_fkey" FOREIGN KEY ("printProfileId") REFERENCES "PrintProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
