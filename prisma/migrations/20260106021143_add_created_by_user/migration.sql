-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "createdByUserId" INTEGER;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "createdByUserId" INTEGER;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
