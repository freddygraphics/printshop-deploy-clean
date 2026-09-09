CREATE TABLE "SupplierPricingSettings" (
    "id" SERIAL NOT NULL,
    "supplier" TEXT NOT NULL,
    "markup" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierPricingSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SupplierPricingSettings_supplier_key"
ON "SupplierPricingSettings"("supplier");