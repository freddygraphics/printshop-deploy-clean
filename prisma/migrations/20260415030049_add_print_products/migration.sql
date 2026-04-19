-- CreateTable
CREATE TABLE "PrintProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sinaliteId" INTEGER NOT NULL,
    "options" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintProduct_pkey" PRIMARY KEY ("id")
);
