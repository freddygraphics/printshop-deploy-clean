/*
  Warnings:

  - A unique constraint covering the columns `[squareOrderId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "squareOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_squareOrderId_key" ON "Invoice"("squareOrderId");
