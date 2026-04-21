-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "pdfStatus" TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN     "pdfUpdatedAt" TIMESTAMP(3);
