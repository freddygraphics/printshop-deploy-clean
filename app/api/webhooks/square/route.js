import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// 🔐 Verificar firma de Square
function verifySignature({ body, signature, url, secret }) {
  const payload = url + body;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

  return hmac === signature;
}

export async function POST(req) {
  try {
    const signature = req.headers.get("x-square-hmacsha256-signature");
    const url = process.env.NEXT_PUBLIC_SITE_URL + "/api/webhooks/square";
    const secret = process.env.SQUARE_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // 🚨 RAW BODY (CRÍTICO)
    const body = await req.text();

    const isValid = verifySignature({
      body,
      signature,
      url,
      secret,
    });

    if (!isValid) {
      console.error("❌ Invalid Square signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    // 👉 Solo pagos completados
    if (event.type !== "payment.updated") {
      return NextResponse.json({ ok: true });
    }

    const payment = event.data.object.payment;

    if (payment.status !== "COMPLETED") {
      return NextResponse.json({ ok: true });
    }

    // 1️⃣ Obtener order_id
    const orderId = payment.order_id;
    if (!orderId) return NextResponse.json({ ok: true });

    // 2️⃣ Obtener order para leer reference_id
    const orderRes = await fetch(
      `https://connect.squareup.com/v2/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          "Square-Version": "2024-01-18",
        },
      },
    );

    const orderData = await orderRes.json();
    const referenceId = orderData?.order?.reference_id;

    if (!referenceId || !referenceId.startsWith("INV-TOKEN-")) {
      return NextResponse.json({ ok: true });
    }

    const publicToken = referenceId.replace("INV-TOKEN-", "");

    // 3️⃣ Buscar invoice
    const invoice = await prisma.invoice.findUnique({
      where: { publicToken },
      include: { payments: true },
    });

    if (!invoice) return NextResponse.json({ ok: true });

    const amount = payment.amount_money.amount / 100;

    // 4️⃣ Crear payment
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        method: "Square",
        note: "Paid via Square",
        paidAt: new Date(payment.created_at),
      },
    });

    // 5️⃣ Recalcular balance
    const totalPaid =
      invoice.payments.reduce((s, p) => s + p.amount, 0) + amount;

    const balance = Math.max(invoice.total - totalPaid, 0);

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        balance,
        paymentStatus: balance === 0 ? "Paid" : "Partially Paid",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
