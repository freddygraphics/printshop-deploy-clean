-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "heightIn" DOUBLE PRECISION,
ADD COLUMN     "priceSnapshot" JSONB,
ADD COLUMN     "pricingMode" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "sqft" DOUBLE PRECISION,
ADD COLUMN     "widthIn" DOUBLE PRECISION;
