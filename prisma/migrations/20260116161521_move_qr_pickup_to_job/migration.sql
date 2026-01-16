/*
  Warnings:

  - You are about to drop the column `pickedUpAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `pickedUpById` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `qrGeneratedAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `qrToken` on the `Invoice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pickupToken]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "pickedUpAt",
DROP COLUMN "pickedUpById",
DROP COLUMN "qrGeneratedAt",
DROP COLUMN "qrToken";

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "pickedUpBy" TEXT,
ADD COLUMN     "pickupToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Job_pickupToken_key" ON "Job"("pickupToken");
