CREATE TABLE "SupplierProduct" (
    "id" SERIAL NOT NULL,
    "supplier" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "category" TEXT,
    "subCategory" TEXT,
    "image" TEXT,
    "material" TEXT,
    "leadTime" INTEGER,
    "variantCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX
"SupplierProduct_supplierCode_productId_key"
ON "SupplierProduct"("supplierCode", "productId");

CREATE INDEX
"SupplierProduct_supplierCode_idx"
ON "SupplierProduct"("supplierCode");

CREATE INDEX
"SupplierProduct_name_idx"
ON "SupplierProduct"("name");

CREATE INDEX
"SupplierProduct_category_idx"
ON "SupplierProduct"("category");