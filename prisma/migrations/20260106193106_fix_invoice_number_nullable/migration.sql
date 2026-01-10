/*
  Warnings:

  - You are about to drop the column `balance` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `createdByUserId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `isVoided` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paidAt` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paymentLink` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `qrGeneratedAt` on the `Invoice` table. All the data in the column will be lost.
  - The `invoiceNumber` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `quoteId` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `createdByUserId` on the `Quote` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invoiceId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.
  - Made the column `tax` on table `Invoice` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `invoiceId` to the `Job` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_createdByUserId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_quoteId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_createdByUserId_fkey";

-- DropIndex
DROP INDEX "Job_quoteId_key";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "balance",
DROP COLUMN "createdByUserId",
DROP COLUMN "discount",
DROP COLUMN "isVoided",
DROP COLUMN "paidAt",
DROP COLUMN "paymentLink",
DROP COLUMN "paymentMethod",
DROP COLUMN "qrGeneratedAt",
ADD COLUMN     "userId" INTEGER,
DROP COLUMN "invoiceNumber",
ADD COLUMN     "invoiceNumber" INTEGER,
ALTER COLUMN "tax" SET NOT NULL,
ALTER COLUMN "total" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "quoteId",
ADD COLUMN     "invoiceId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "createdByUserId",
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "userId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Job_invoiceId_key" ON "Job"("invoiceId");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
