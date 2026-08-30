-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_templateId_fkey";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "templateId";

-- DropTable
DROP TABLE "Template";