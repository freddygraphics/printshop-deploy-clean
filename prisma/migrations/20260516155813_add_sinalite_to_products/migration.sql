-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "profitMargin" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ADD COLUMN     "sinaliteEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sinaliteId" INTEGER,
ADD COLUMN     "sinaliteOptions" JSONB;
