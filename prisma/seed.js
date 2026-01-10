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

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
