import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

// ✅ ENDPOINT REAL DE PRODUCCIÓN
const SQUARE_URL =
  "https://connect.squareup.com/v2/online-checkout/payment-links";

export async function POST(req) {
  try {
    const { invoiceId, amount, label } = await req.json();

    if (!invoiceId || !amount) {
      return NextResponse.json(
        { error: "Missing invoiceId or amount" },
        { status: 400 }
      );
    }

    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (!accessToken || !locationId || !baseUrl) {
      return NextResponse.json(
        { error: "Missing Square or Base URL env vars" },
        { status: 500 }
      );
    }

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
          line_items: [
            {
              name: label || `Invoice #${invoiceId}`,
              quantity: "1",
              base_price_money: {
                amount: Math.round(Number(amount) * 100),
                currency: "USD",
              },
            },
          ],
        },
        checkout_options: {
          redirect_url: `${baseUrl}/invoice/${invoiceId}?paid=1`,
        },
      }),
    });

    const data = await response.json();

    console.log("SQUARE RESPONSE:", data);

    if (!response.ok) {
      return NextResponse.json(
        { error: data.errors || "Square API error" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.payment_link.url,
    });
  } catch (err) {
    console.error("CHECKOUT ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Checkout failed" },
      { status: 500 }
    );
  }
}
