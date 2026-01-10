-- 1️⃣ Crear el enum
CREATE TYPE "InvoiceStatus" AS ENUM (
  'DRAFT',
  'SENT',
  'PARTIAL',
  'PAID',
  'VOID'
);

-- 2️⃣ Quitar el DEFAULT antes de convertir el tipo
ALTER TABLE "Invoice"
ALTER COLUMN "status" DROP DEFAULT;

-- 3️⃣ Convertir la columna SIN perder datos
ALTER TABLE "Invoice"
ALTER COLUMN "status" TYPE "InvoiceStatus"
USING "status"::"InvoiceStatus";

-- 4️⃣ Volver a poner el DEFAULT ya como enum
ALTER TABLE "Invoice"
ALTER COLUMN "status" SET DEFAULT 'DRAFT';
