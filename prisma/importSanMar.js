const fs = require("fs");
const { parse } = require("csv-parse");
const { PrismaClient } = require("@prisma/client");

let prisma = new PrismaClient();

const BATCH_SIZE = 10;
const MAX_RETRIES = 10;
const SANMAR_IMAGE_BASE_URL = "https://cdnm.sanmar.com/imglib/mresjpg/";

function cleanText(value) {
  if (!value) return null;

  return String(value)
    .replace(/&#174;/gi, "®")
    .replace(/&reg;/gi, "®")
    .replace(/&#8482;/gi, "™")
    .replace(/&trade;/gi, "™")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const cleaned = String(value).replace(/[$,]/g, "").trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : fallback;
}

function buildImageUrl(row) {
  const candidates = [
    row.FRONT_MODEL_IMAGE_URL,
    row.COLOR_PRODUCT_IMAGE,
    row.PRODUCT_IMAGE,
    row.FRONT_FLAT_IMAGE,
    row.THUMBNAIL_IMAGE,
  ];

  const selected = candidates.find((value) => value && String(value).trim());

  if (!selected) return null;

  const image = String(selected).trim();

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `${SANMAR_IMAGE_BASE_URL}${image}`;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isConnectionError(error) {
  const retryableCodes = ["P1001", "P1002", "P1017", "P2024"];
  const message = String(error?.message || "").toLowerCase();

  return (
    retryableCodes.includes(error?.code) ||
    message.includes("can't reach database server") ||
    message.includes("server has closed the connection") ||
    message.includes("connection pool") ||
    message.includes("timed out")
  );
}

async function reconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch {}

  prisma = new PrismaClient();

  try {
    await prisma.$connect();
  } catch {}
}

async function flushVariants(variants) {
  if (variants.length === 0) return;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await prisma.$transaction(
        variants.map((variant) =>
          prisma.apparelVariant.upsert({
            where: {
              supplierSku: variant.supplierSku,
            },
            update: {
              productId: variant.productId,
              color: variant.color,
              colorCode: variant.colorCode,
              size: variant.size,
              supplierPrice: variant.supplierPrice,
              inventory: variant.inventory,
              warehouseData: variant.warehouseData,
              active: variant.active,
              lastInventoryAt: new Date(),
            },
            create: {
              ...variant,
              lastInventoryAt: new Date(),
            },
          }),
        ),
        {
          maxWait: 60000,
          timeout: 120000,
        },
      );

      return;
    } catch (error) {
      if (!isConnectionError(error) || attempt === MAX_RETRIES) {
        throw error;
      }

      const delay = Math.min(attempt * 10000, 60000);

      console.warn(
        `Conexión interrumpida (${error?.code || "sin código"}). ` +
          `Reintento ${attempt}/${MAX_RETRIES} en ${delay / 1000} segundos...`,
      );

      await wait(delay);
      await reconnectPrisma();
    }
  }
}

async function main() {
  const csvPath = process.argv[2];

  if (!csvPath) {
    throw new Error(
      "Debes indicar la ruta del CSV. Ejemplo:\n" +
        'npm run import:sanmar -- "C:\\SanMar\\SanMar_EPDD.csv"',
    );
  }

  if (!fs.existsSync(csvPath)) {
    throw new Error(`No se encontró el archivo: ${csvPath}`);
  }

  console.log(`Importando catálogo desde: ${csvPath}`);
  console.log("No cierres esta ventana durante la importación.");

  const productCache = new Map();
  let variantBatch = [];

  let rowsRead = 0;
  let productsProcessed = 0;
  let variantsProcessed = 0;
  let rowsSkipped = 0;

  const parser = fs.createReadStream(csvPath).pipe(
    parse({
      columns: true,
      bom: true,
      skip_empty_lines: true,
      relax_quotes: true,
      relax_column_count: true,
      trim: true,
    }),
  );

  for await (const row of parser) {
    rowsRead += 1;

    const supplierStyle = cleanText(row["STYLE#"]);
    const supplierSku = cleanText(row.UNIQUE_KEY);
    const productName = cleanText(row.PRODUCT_TITLE);
    const color = cleanText(row.COLOR_NAME);
    const size = cleanText(row.SIZE);

    if (!supplierStyle || !supplierSku || !productName || !color || !size) {
      rowsSkipped += 1;
      continue;
    }

    let productId = productCache.get(supplierStyle);

    if (!productId) {
      const product = await prisma.apparelProduct.upsert({
        where: {
          supplier_supplierStyle: {
            supplier: "SanMar",
            supplierStyle,
          },
        },
        update: {
          name: productName,
          description: cleanText(row.PRODUCT_DESCRIPTION),
          brand: cleanText(row.MILL),
          category: cleanText(row.CATEGORY_NAME),
          subcategory: cleanText(row.SUBCATEGORY_NAME),
          imageUrl: buildImageUrl(row),
          active:
            String(row.PRODUCT_STATUS || "").toLowerCase() !== "discontinued",
          lastSyncedAt: new Date(),
        },
        create: {
          supplier: "SanMar",
          supplierStyle,
          name: productName,
          description: cleanText(row.PRODUCT_DESCRIPTION),
          brand: cleanText(row.MILL),
          category: cleanText(row.CATEGORY_NAME),
          subcategory: cleanText(row.SUBCATEGORY_NAME),
          imageUrl: buildImageUrl(row),
          active:
            String(row.PRODUCT_STATUS || "").toLowerCase() !== "discontinued",
          lastSyncedAt: new Date(),
        },
      });

      productId = product.id;
      productCache.set(supplierStyle, productId);
      productsProcessed += 1;
    }

    variantBatch.push({
      productId,
      supplierSku,
      color,
      colorCode: cleanText(row.PMS_COLOR),
      size,
      supplierPrice: toNumber(row.PIECE_PRICE),
      inventory: Math.max(0, Math.trunc(toNumber(row.QTY))),
      warehouseData: {
        inventoryKey: cleanText(row.INVENTORY_KEY),
        gtin: cleanText(row.GTIN),
        sizeIndex: cleanText(row.SIZE_INDEX),
        priceGroup: cleanText(row.PRICE_GROUP),
        caseSize: toNumber(row.CASE_SIZE),
        dozenPrice: toNumber(row.DOZENS_PRICE),
        casePrice: toNumber(row.CASE_PRICE),
        msrp: toNumber(row.MSRP),
        mapPricing: toNumber(row.MAP_PRICING),
        productStatus: cleanText(row.PRODUCT_STATUS),
        colorImage: buildImageUrl(row),
      },
      active: String(row.PRODUCT_STATUS || "").toLowerCase() !== "discontinued",
    });

    if (variantBatch.length >= BATCH_SIZE) {
      await flushVariants(variantBatch);
      variantsProcessed += variantBatch.length;
      variantBatch = [];

      if (variantsProcessed % 1000 === 0) {
        console.log(
          `Filas: ${rowsRead.toLocaleString()} | ` +
            `Productos: ${productsProcessed.toLocaleString()} | ` +
            `Variantes: ${variantsProcessed.toLocaleString()}`,
        );
      }
    }
  }

  await flushVariants(variantBatch);
  variantsProcessed += variantBatch.length;

  console.log("");
  console.log("Importación de SanMar completada.");
  console.log(`Filas leídas: ${rowsRead.toLocaleString()}`);
  console.log(`Productos procesados: ${productsProcessed.toLocaleString()}`);
  console.log(`Variantes procesadas: ${variantsProcessed.toLocaleString()}`);
  console.log(`Filas omitidas: ${rowsSkipped.toLocaleString()}`);
}

main()
  .catch((error) => {
    console.error("");
    console.error("Error importando SanMar:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
