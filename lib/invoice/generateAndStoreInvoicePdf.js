import { put } from "@vercel/blob";
import prisma from "@/lib/db";

export async function generateAndStorePDF(invoiceId) {
  const htmlUrl = `https://app.freddygraphics.com/api/invoices/${invoiceId}/html`;

  // 🔥 GENERAR PDF CON PDFSHIFT
  const response = await fetch("https://api.pdfshift.io/v3/convert/pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": process.env.PDFSHIFT_API_KEY,
    },
    body: JSON.stringify({
      source: htmlUrl,
      use_print: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const pdfBuffer = Buffer.from(await response.arrayBuffer());

  // 💾 GUARDAR EN BLOB
  const blob = await put(`invoices/${invoiceId}.pdf`, pdfBuffer, {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
  });

  // 🧠 GUARDAR URL EN DB
  await prisma.invoice.update({
    where: { id: Number(invoiceId) },
    data: {
      pdfUrl: blob.url,
    },
  });

  return blob.url;
}
