// /app/api/quotes/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/* =====================================================
   GET /api/quotes — Listar quotes
===================================================== */
export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: true },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("❌ ERROR GET /quotes:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* =====================================================
   POST /api/quotes — Crear quote (tipo ShopVOX)
===================================================== */
export async function POST(req) {
  try {
    const body = await req.json();

    const {
      clientId,
      quoteDate,
      expiryDate,
      status,
      items = [],
      subtotal,
      tax,
      total,
      paymentOption,
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client required" }, { status: 400 });
    }
    const counter = await prisma.counter.upsert({
      where: { name: "quote" },
      update: { value: { increment: 1 } },
      create: { name: "quote", value: 99 }, // 👈 CLAVE
    });

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: counter.value,
        clientId,
        quoteDate: new Date(quoteDate),
        validUntil: expiryDate ? new Date(expiryDate) : null,
        status,
        subtotal,
        tax,
        total,
        paymentOption,

        createdByUserId: session.user.id,
        // 🔥 AQUÍ ESTABA EL PROBLEMA
        items: {
          create: items.map((i, index) => ({
            productId: i.productId ?? null,

            name:
              (typeof i.name === "string" && i.name.trim()) ||
              (typeof i.description === "string" && i.description.trim()) ||
              `Manual Item ${index + 1}`,

            qty: Number(i.qty) > 0 ? Number(i.qty) : 1,
            unitPrice: Number(i.unitPrice) > 0 ? Number(i.unitPrice) : 0,
            total:
              Number(i.total) > 0
                ? Number(i.total)
                : (Number(i.qty) || 1) * (Number(i.unitPrice) || 0),

            options: i.options || {},
            notes: i.notes || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("❌ CREATE QUOTE ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
