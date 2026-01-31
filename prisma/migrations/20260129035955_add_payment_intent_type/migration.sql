/*
  Warnings:

  - You are about to drop the column `paymentIntent` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "paymentIntent";

-- AlterTable
ALTER TABLE "PaymentIntent" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'full',
ALTER COLUMN "status" SET DEFAULT 'active';
