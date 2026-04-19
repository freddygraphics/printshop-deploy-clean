import prisma from "@/lib/db";
import { generateAndStorePDF } from "@/lib/invoice/generateAndStoreInvoicePdf";

export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    console.log("PDF request for:", id);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return new Response("Not found", { status: 404 });
    }

    if (!invoice.pdfUrl) {
      console.log("Generating PDF...");

      const url = await generateAndStorePDF(id);

      return Response.redirect(url);
    }

    console.log("Using cached PDF:", invoice.pdfUrl);

    return Response.redirect(invoice.pdfUrl);
  } catch (err) {
    console.error("❌ PDF ERROR:", err);
    return new Response(err.message, { status: 500 });
  }
}
