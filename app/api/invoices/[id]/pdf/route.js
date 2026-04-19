import prisma from "@/lib/db";
import { generateAndStorePDF } from "@/lib/invoice/generateAndStoreInvoicePdf";

export async function GET(req, { params }) {
  const id = Number(params.id);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    return new Response("Not found", { status: 404 });
  }

  // ⚡ SI NO EXISTE → LO CREA
  if (!invoice.pdfUrl) {
    const url = await generateAndStorePDF(id);
    return Response.redirect(url);
  }

  // ⚡ SI EXISTE → INSTANTÁNEO
  return Response.redirect(invoice.pdfUrl);
}
