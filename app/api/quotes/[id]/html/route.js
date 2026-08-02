export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { buildInvoiceHtml } from "@/lib/invoice/buildInvoiceHtml";

export async function GET(req, { params }) {
  try {
    const { id: paramId } = await params;

    if (!paramId) {
      return new NextResponse("Missing quote id", {
        status: 400,
      });
    }

    const id = Number(paramId);

    if (!Number.isFinite(id)) {
      return new NextResponse("Invalid quote id", {
        status: 400,
      });
    }

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
      },
    });

    if (!quote) {
      return new NextResponse("Quote not found", {
        status: 404,
      });
    }

    const html = buildInvoiceHtml({
      documentType: "quote",

      invoiceId: quote.id,
      invoiceNumber: quote.quoteNumber || quote.id,

      issuedAt: quote.quoteDate,
      dueDate: quote.validUntil,

      status: quote.status,
      client: quote.client,
      items: quote.items || [],

      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,

      discountAmount: quote.discountAmount || 0,
      discountLabel: quote.discountLabel || null,

      payments: [],
      balance: quote.total,
    });

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("HTML QUOTE ERROR:", err);

    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}
