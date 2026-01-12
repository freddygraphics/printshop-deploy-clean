/*
  Warnings:

  - The `status` column on the `Job` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('Pending', 'Design', 'Production', 'Ready', 'Delivered');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "pickedUpAt" TIMESTAMP(3),
ADD COLUMN     "pickedUpById" INTEGER;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "status",
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'Pending';
