import prisma from "../lib/db.js";
import crypto from "crypto";

async function run() {
  const invoices = await prisma.invoice.findMany({
    where: {
      OR: [{ publicToken: "" }, { publicToken: undefined }],
    },
  });

  console.log(`🔍 Invoices without token: ${invoices.length}`);

  for (const invoice of invoices) {
    const token = crypto.randomBytes(8).toString("hex");

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { publicToken: token },
    });

    console.log(`✅ Invoice ${invoice.id} → ${token}`);
  }

  await prisma.$disconnect();
}

run().catch(async (err) => {
  console.error("❌ Error:", err);
  await prisma.$disconnect();
  process.exit(1);
});
