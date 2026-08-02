export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "../../../../../lib/db";

export async function POST(req, { params }) {
  try {
    const quoteId = Number(params.id);

    if (Number.isNaN(quoteId)) {
      return NextResponse.json({ error: "Invalid quote ID" }, { status: 400 });
    }

    // 1. Cargar quote + items
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // 2. Evitar duplicados
    const existingInvoice = await prisma.invoice.findFirst({
      where: { quoteId },
    });

    if (existingInvoice) {
      return NextResponse.json(
        {
          error: "Invoice already exists for this quote",
          invoiceId: existingInvoice.id,
        },
        { status: 409 },
      );
    }

    const invoice = await prisma.$transaction(async (tx) => {
      const counter = await tx.counter.upsert({
        where: {
          name: "invoice",
        },
        update: {
          value: {
            increment: 1,
          },
        },
        create: {
          name: "invoice",
          value: 99,
        },
      });

      return tx.invoice.create({
        data: {
          invoiceNumber: counter.value,
          publicToken: randomUUID(),

          quoteId: quote.id,
          clientId: quote.clientId,

          subtotal: Number(quote.subtotal || 0),
          tax: Number(quote.tax || 0),
          discountAmount: 0,
          total: Number(quote.total || 0),
          balance: Number(quote.total || 0),

          paymentStatus: "Unpaid",
          issuedAt: new Date(),

          invoiceItems: {
            create: quote.items.map((item) => ({
              productId: item.productId ?? null,

              name: item.name || item.description || "Item",

              qty: Number(item.qty || 1),
              unitPrice: Number(item.unitPrice || 0),
              total: Number(item.total || 0),

              options:
                item.options && typeof item.options === "object"
                  ? item.options
                  : {},

              notes: item.notes ?? null,
            })),
          },
        },

        include: {
          invoiceItems: true,
        },
      });
    });

    // 5. Marcar quote como convertido
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: "Converted to Invoice",
      },
    });

    return NextResponse.json(invoice, {
      status: 201,
    });
  } catch (error) {
    console.error("❌ Convert Quote → Invoice error:", error);

    return NextResponse.json(
      {
        error: error?.message || "Server error",
      },
      {
        status: 500,
      },
    );
  }
}
