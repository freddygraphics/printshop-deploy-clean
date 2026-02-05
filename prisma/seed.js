import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function safe(name, fn) {
  try {
    await fn();
  } catch (err) {
    console.warn(`⚠️ ${name} skipped: ${err.code || err.message}`);
  }
}

async function main() {
  console.log("🌱 Running seed...");

  // =========================
  // TEMPLATES
  // =========================
  await prisma.template.createMany({
    data: [
      { name: "Commercial Printing", type: "commercial-printing" },
      { name: "Large Format", type: "large-format" },
    ],
    skipDuplicates: true,
  });

  console.log("🧩 Templates seeded");

  // =========================
  // SETTINGS
  // =========================
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    await prisma.settings.create({
      data: {
        defaultTaxRate: 6.625,
        maxDiscountPercent: 20,
        paymentFeePercent: 3,
        paymentFeeFlat: 0.3,
        defaultDepositPercent: 50,
        defaultTerms: "Net 15",
      },
    });

    console.log("⚙️ Settings seeded");
  }

  // =========================
  // MATERIAL
  // =========================
  let bannerMaterial = null;
  await safe("Material", async () => {
    bannerMaterial = await prisma.material.findFirst({
      where: { name: "Banner 13oz" },
    });

    if (!bannerMaterial) {
      bannerMaterial = await prisma.material.create({
        data: {
          name: "Banner 13oz",
          category: "banner",
          unitType: "roll",
          rollWidthIn: 54,
          rollLengthFt: 150,
          rollCost: 160,
          wastePercent: 15,
          costPerSqft: 0.28,
          sellPerSqft: 5.5,
        },
      });
      console.log("🧵 Material seeded");
    }
  });

  // =========================
  // PROCESS
  // =========================
  let ecoProcess = null;
  await safe("Process", async () => {
    ecoProcess = await prisma.process.findFirst({
      where: { name: "Printing (Eco-Solvent)" },
    });

    if (!ecoProcess) {
      ecoProcess = await prisma.process.create({
        data: {
          name: "Printing (Eco-Solvent)",
          category: "print",
          costPerSqft: 0.35,
          sellPerSqft: 2.0,
        },
      });
      console.log("🖨️ Process seeded");
    }
  });

  // =========================
  // PRODUCT
  // =========================
  await safe("Product", async () => {
    const product = await prisma.product.findFirst({
      where: { name: "Banner 13oz" },
    });

    if (!product) {
      await prisma.product.create({
        data: {
          name: "Banner 13oz",
          sku: "BANNER-13OZ",
          category: "large-format",
          templateType: "large-format",
          basePrice: 0,
        },
      });
      console.log("📦 Product seeded");
    }
  });

  // =========================
  // PRINT PRODUCTION PROFILE
  // =========================
  await safe("PrintProductionProfile", async () => {
    if (!ecoProcess || !bannerMaterial) return;

    const profile = await prisma.printProductionProfile.findFirst({
      where: { name: "Banner 13oz SQFT" },
    });

    if (!profile) {
      await prisma.printProductionProfile.create({
        data: {
          name: "Banner 13oz SQFT",
          machine: "Roland BN-20A",
          processId: ecoProcess.id,
          materialId: bannerMaterial.id,
          minWidth: 12,
          maxWidth: 120,
          minHeight: 12,
          maxHeight: 120,
          wastePercent: 10,
          setupCost: 0,
        },
      });
      console.log("🏭 Print production profile seeded");
    }
  });

  console.log("✅ Seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Seed fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
