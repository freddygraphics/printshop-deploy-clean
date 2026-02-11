export const dynamic = "force-dynamic";

// app/api/payments/square/checkout/route.js
import prisma from "@/lib/db";
import crypto from "crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // 1ï¸âƒ£ Buscar invoice
    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: token },
      include: {
        paymentIntents: {
          where: { status: "pending" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!invoice || invoice.paymentIntents.length === 0) {
      return NextResponse.json(
        { error: "No active payment intent" },
        { status: 400 },
      );
    }

    const intent = invoice.paymentIntents[0];

    // 2ï¸âƒ£ Crear Payment Link en Square
    const res = await fetch(
      "https://connect.squareup.com/v2/online-checkout/payment-links",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "Square-Version": "2024-01-18",
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          order: {
            location_id: process.env.SQUARE_LOCATION_ID,
            reference_id: `INV-TOKEN-${invoice.publicToken}`,
            line_items: [
              {
                name: `Invoice #${invoice.invoiceNumber}`,
                quantity: "1",
                base_price_money: {
                  amount: Math.round(intent.totalCharged * 100),
                  currency: "USD",
                },
              },
            ],
          },
          checkout_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment-success?invoice=${invoice.invoiceNumber}`,
          },
        }),
      },
    );

    const data = await res.json();

    if (!res.ok || !data.payment_link?.url) {
      console.error("âŒ Square error:", data);
      return NextResponse.json(
        { error: "Square checkout failed" },
        { status: 500 },
      );
    }

    // 3ï¸âƒ£ EXTRAER order_id
    const orderId = data.payment_link.order_id;
    if (!orderId) {
      console.error("âŒ Square order_id missing", data);
      return NextResponse.json(
        { error: "Square order_id missing" },
        { status: 500 },
      );
    }

    // 4ï¸âƒ£ GUARDAR EN INVOICE (ðŸ”¥ AQUÃ SÃ EXISTE invoice)
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        squareLinkId: data.payment_link.id,
        squareOrderId: orderId,
      },
    });

    // 5ï¸âƒ£ DEVOLVER LINK
    return NextResponse.json({
      url: data.payment_link.url,
    });
  } catch (err) {
    console.error("âŒ Square checkout error:", err);
    return NextResponse.json(
      { error: "Square checkout failed" },
      { status: 500 },
    );
  }
}

