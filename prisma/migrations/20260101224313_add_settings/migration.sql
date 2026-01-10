-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "taxEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultTaxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowDiscounts" BOOLEAN NOT NULL DEFAULT true,
    "maxDiscountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentFeeFlat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "applyFeeToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "defaultTerms" TEXT NOT NULL DEFAULT 'Due on receipt',
    "defaultDepositPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultCustomerNotes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);
