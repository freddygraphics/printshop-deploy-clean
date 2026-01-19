import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

// 🔹 Sandbox o Producción (según tu token)
// 🟢 SANDBOX (LOCAL / TESTING)
// 🚀 PRODUCCIÓN
const SQUARE_URL =
  "https://connect.squareup.com/v2/online-checkout/payment-links";

export async function POST(req) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing public token" },
        { status: 400 },
      );
    }

    // 1️⃣ Buscar invoice por TOKEN (NO por ID)
    const invoice = await prisma.invoice.findUnique({
      where: { publicToken: token },
      include: {
        invoiceItems: true,
        payments: true,
        appliedDiscounts: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2️⃣ RECALCULAR BALANCE (FUENTE DE VERDAD)
    const subtotal = invoice.invoiceItems.reduce(
      (sum, i) => sum + Number(i.total ?? i.unitPrice * i.qty),
      0,
    );

    const discount = invoice.appliedDiscounts?.[0] || null;

    let discountAmount = 0;
    if (discount) {
      discountAmount =
        discount.type === "percent"
          ? subtotal * (discount.value / 100)
          : discount.value;
      discountAmount = Math.min(discountAmount, subtotal);
    }

    const discountedSubtotal = subtotal - discountAmount;

    const taxRate = Number(invoice.taxRate || 0);
    const tax =
      invoice.taxEnabled && taxRate > 0
        ? discountedSubtotal * (taxRate / 100)
        : 0;

    const total = discountedSubtotal + tax;

    const paymentsTotal = invoice.payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    const balance = Math.max(total - paymentsTotal, 0);

    if (balance <= 0) {
      return NextResponse.json(
        { error: "Invoice already paid" },
        { status: 400 },
      );
    }

    // 3️⃣ Square config
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL; // 👉 pay.freddygraphics.com

    if (!accessToken || !locationId || !siteUrl) {
      return NextResponse.json(
        { error: "Missing Square env vars" },
        { status: 500 },
      );
    }

    // 4️⃣ Crear checkout en Square
    const response = await fetch(SQUARE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        order: {
          location_id: locationId,
          reference_id: `INV-TOKEN-${invoice.publicToken}`,
          line_items: [
            {
              name: `Invoice #${invoice.invoiceNumber}`,
              quantity: "1",
              base_price_money: {
                amount: Math.round(balance * 100),
                currency: "USD",
              },
            },
          ],
        },

        checkout_options: {
          redirect_url: `${siteUrl}/i/${invoice.publicToken}?paid=1`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.payment_link?.url) {
      console.error("❌ Square error:", data);
      return NextResponse.json(
        { error: "Square checkout error" },
        { status: 500 },
      );
    }

    // 5️⃣ DEVOLVER URL A /pay/[token]
    return NextResponse.json({
      checkoutUrl: data.payment_link.url,
    });
  } catch (err) {
    console.error("❌ CHECKOUT ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Checkout failed" },
      { status: 500 },
    );
  }
}
