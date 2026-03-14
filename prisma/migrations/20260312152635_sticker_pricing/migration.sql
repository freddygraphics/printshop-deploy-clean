-- CreateTable
CREATE TABLE "PrintSettings" (
    "id" TEXT NOT NULL,
    "stickerRollPrice" DOUBLE PRECISION NOT NULL,
    "stickerRollWidth" DOUBLE PRECISION NOT NULL,
    "stickerRollLength" DOUBLE PRECISION NOT NULL,
    "laminateRollPrice" DOUBLE PRECISION NOT NULL,
    "laminateRollWidth" DOUBLE PRECISION NOT NULL,
    "laminateRollLength" DOUBLE PRECISION NOT NULL,
    "laborPerHour" DOUBLE PRECISION NOT NULL,
    "profitMargin" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SheetSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SheetSize_pkey" PRIMARY KEY ("id")
);
