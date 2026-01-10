-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "qrGeneratedAt" TIMESTAMP(3),
ALTER COLUMN "issuedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "InvoiceDiscount" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "discountId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceDiscount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InvoiceDiscount" ADD CONSTRAINT "InvoiceDiscount_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
