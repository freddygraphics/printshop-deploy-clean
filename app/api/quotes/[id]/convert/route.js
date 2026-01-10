import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";

export async function POST(req, { params }) {
  try {
    const quoteId = Number(params.id);
    if (isNaN(quoteId)) {
      return NextResponse.json({ error: "Invalid quote ID" }, { status: 400 });
    }

    // 1️⃣ Cargar quote + items
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: true },
    });

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // 2️⃣ Evitar duplicados
    const existingInvoice = await prisma.invoice.findFirst({
      where: { quoteId },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: "Invoice already exists for this quote" },
        { status: 409 }
      );
    }

    // 3️⃣ Obtener invoiceNumber
    const counter = await prisma.counter.upsert({
      where: { name: "invoice" },
      update: { value: { increment: 1 } },
      create: { name: "invoice", value: 99 },
    });

    const invoiceNumber = `IN-${counter.value}`;

    // 4️⃣ Crear Invoice
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        quoteId: quote.id,
        clientId: quote.clientId,

        subtotal: quote.subtotal,
        tax: quote.tax ?? 0,
        discount: 0,
        total: quote.total,
        balance: quote.total,

        paymentStatus: "Unpaid",
        issuedAt: new Date(),

        invoiceItems: {
          create: quote.items.map((i) => ({
            productId: i.productId ?? null,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
            total: i.total,
            options: i.options ?? {},
            notes: i.notes ?? null,
          })),
        },
      },
      include: {
        invoiceItems: true,
      },
    });

    // 5️⃣ Marcar quote como convertido
    await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "Converted to Invoice" },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("❌ Convert Quote → Invoice error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
