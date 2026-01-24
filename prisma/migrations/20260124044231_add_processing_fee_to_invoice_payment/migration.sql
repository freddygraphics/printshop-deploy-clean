-- AlterTable
ALTER TABLE "InvoicePayment" ADD COLUMN     "processingFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
