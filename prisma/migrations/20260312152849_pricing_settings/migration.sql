-- CreateTable
CREATE TABLE "PrintPricingSettings" (
    "id" TEXT NOT NULL,
    "vinylRollPrice" DOUBLE PRECISION NOT NULL,
    "vinylRollWidth" DOUBLE PRECISION NOT NULL,
    "vinylRollLength" DOUBLE PRECISION NOT NULL,
    "laminateRollPrice" DOUBLE PRECISION NOT NULL,
    "laminateRollWidth" DOUBLE PRECISION NOT NULL,
    "laminateRollLength" DOUBLE PRECISION NOT NULL,
    "laborPerHour" DOUBLE PRECISION NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintPricingSettings_pkey" PRIMARY KEY ("id")
);
