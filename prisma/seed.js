import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Running seed...");

  // =========================
  // TEMPLATES
  // =========================
  await prisma.template.deleteMany();

  await prisma.template.createMany({
    data: [
      {
        id: 1,
        name: "Commercial Printing",
        type: "commercial-printing",
        fields: {},
        options: {},
      },
      {
        id: 2,
        name: "Large Format",
        type: "large-format",
        fields: {},
        options: {},
      },
    ],
  });

  console.log("✅ Templates created successfully");

  // =========================
  // SETTINGS (solo si no existe)
  // =========================
  const settingsExists = await prisma.settings.findFirst();

  if (!settingsExists) {
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

    console.log("✅ Settings created");
  } else {
    console.log("ℹ️ Settings already exist");
  }
}
// =========================
// MATERIALS (solo si no existen)
// =========================
const banner13ozExists = await prisma.material.findFirst({
  where: { name: "Banner 13oz" },
});

if (!banner13ozExists) {
  await prisma.material.create({
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

  console.log("✅ Material Banner 13oz creado");
} else {
  console.log("ℹ️ Material Banner 13oz ya existe");
}

// =========================
// PROCESSES (solo si no existen)
// =========================
const printEcoExists = await prisma.process.findFirst({
  where: { name: "Printing (Eco-Solvent)" },
});

if (!printEcoExists) {
  await prisma.process.create({
    data: {
      name: "Printing (Eco-Solvent)",
      category: "print",
      costPerSqft: 0.35,
      sellPerSqft: 2.0,
    },
  });

  console.log("✅ Process Printing (Eco-Solvent) creado");
} else {
  console.log("ℹ️ Process Printing (Eco-Solvent) ya existe");
}

// =========================
// PRODUCTS (Large Format)
// =========================
const bannerProduct = await prisma.product.findFirst({
  where: { name: "Banner 13oz" },
});

if (!bannerProduct) {
  await prisma.product.create({
    data: {
      name: "Banner 13oz",
      sku: "BANNER-13OZ",
      category: "large-format",
      templateType: "large-format",
      basePrice: 0,
      defaultOptions: {
        pricingMode: "sqft",
        widthIn: null,
        heightIn: null,
        material: "Banner 13oz",
      },
    },
  });

  console.log("✅ Product Banner 13oz created");
}

// =========================
// PRINT PROFILES (solo si no existen)
// =========================
const bannerSqftProfileExists = await prisma.printProfile.findFirst({
  where: { name: "Banner SQFT" },
});

if (!bannerSqftProfileExists) {
  await prisma.printProfile.create({
    data: {
      name: "Banner SQFT",
      pricingMode: "sqft",

      allowedMaterials: ["Banner 13oz"],
      defaultProcesses: ["Printing (Eco-Solvent)"],
      allowedFinishes: ["Grommets", "Hemming"],

      notes: "Perfil estándar para banners impresos por área (SQFT)",
    },
  });

  console.log("✅ PrintProfile Banner SQFT creado");
} else {
  console.log("ℹ️ PrintProfile Banner SQFT ya existe");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
