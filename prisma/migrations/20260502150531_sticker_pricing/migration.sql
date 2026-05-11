-- CreateTable
CREATE TABLE "StickerSheetPricing" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "costPerSheet" DOUBLE PRECISION NOT NULL,
    "laminateCost" DOUBLE PRECISION NOT NULL,
    "cutCost" DOUBLE PRECISION NOT NULL,
    "wastePercent" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "profitMargin" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StickerSheetPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StickerSheetPricing_name_key" ON "StickerSheetPricing"("name");
