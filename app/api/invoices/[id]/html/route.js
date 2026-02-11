// ðŸ‘‡ OBLIGATORIO PARA PRISMA
export const runtime = "nodejs";

import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";
import { buildInvoiceHtml } from "@/lib/invoice/buildInvoiceHtml";

export async function GET(req, { params }) {
  try {
    if (!params?.id) {
      return new NextResponse("Missing invoice id", { status: 400 });
    }

    const id = Number(params.id);
    if (!Number.isFinite(id)) {
      return new NextResponse("Invalid invoice id", { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        invoiceItems: true,
        payments: true,
      },
    });

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    // ðŸ‘‡ SI ES async, ESTO LO ARREGLA
    const html = await buildInvoiceHtml({
      invoiceNumber: invoice.invoiceNumber,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      status: invoice.paymentStatus,
      client: invoice.client,
      items: invoice.invoiceItems,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      balance: invoice.balance,
      payments: invoice.payments,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("âŒ HTML INVOICE ERROR:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

