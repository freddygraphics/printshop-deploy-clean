/*
  Warnings:

  - A unique constraint covering the columns `[squarePaymentId]` on the table `InvoicePayment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "squareLinkId" TEXT,
ADD COLUMN     "squarePaymentId" TEXT;

-- AlterTable
ALTER TABLE "InvoicePayment" ADD COLUMN     "squarePaymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InvoicePayment_squarePaymentId_key" ON "InvoicePayment"("squarePaymentId");
