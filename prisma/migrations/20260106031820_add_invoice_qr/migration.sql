/*
  Warnings:

  - A unique constraint covering the columns `[qrToken]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "qrToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_qrToken_key" ON "Invoice"("qrToken");
