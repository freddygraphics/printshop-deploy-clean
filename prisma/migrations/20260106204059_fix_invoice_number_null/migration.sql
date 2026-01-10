/*
  Warnings:

  - Made the column `invoiceNumber` on table `Invoice` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Invoice_qrToken_key";
-- FIX existing invoices with NULL invoiceNumber
UPDATE "Invoice"
SET "invoiceNumber" = id
WHERE "invoiceNumber" IS NULL;

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "invoiceNumber" SET NOT NULL;
