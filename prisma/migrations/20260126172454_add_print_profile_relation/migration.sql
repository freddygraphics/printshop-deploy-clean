/*
  Warnings:

  - You are about to drop the column `allowedFinishes` on the `PrintProfile` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `PrintProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Material" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "rollCost" DROP NOT NULL,
ALTER COLUMN "wastePercent" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PrintProfile" DROP COLUMN "allowedFinishes",
DROP COLUMN "notes",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "minSubtotal" DOUBLE PRECISION;
