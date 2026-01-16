import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { buildInvoiceHtml } from "@/lib/invoice/buildInvoiceHtml";

export async function GET(req, { params }) {
  const id = Number(params.id);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      client: true,
      invoiceItems: true,
    },
  });

  if (!invoice) {
    return new NextResponse("Invoice not found", { status: 404 });
  }

  const html = buildInvoiceHtml(invoice);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
