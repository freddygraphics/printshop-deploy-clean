import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// =================================
// 🔐 Verify Square Signature
// =================================
function verifySignature(
  body: string,
  signature: string,
  url: string,
  secret: string,
) {
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(url + body)
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

// =================================
// POST — WEBHOOK
// =================================
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.SQUARE_WEBHOOK_SECRET!;
    const url = "https://app.freddygraphics.com/api/webhooks/square";

    if (!verifySignature(body, signature, url, secret)) {
      console.error("❌ Invalid Square signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // 🔕 Solo pagos
    if (!event.type?.startsWith("payment.")) {
      return NextResponse.json({ ok: true });
    }

    const payment = event.data?.object?.payment;
    if (!payment || payment.status !== "COMPLETED") {
      return NextResponse.json({ ok: true });
    }

    if (!payment.amount_money?.amount) {
      return NextResponse.json({ ok: true });
    }

    // =================================
    // 🔥 ORDER ID (CLAVE)
    // =================================
    const orderId = payment.order_id;
    if (!orderId) {
      console.warn("⚠️ Payment without order_id");
      return NextResponse.json({ ok: true });
    }

    // =================================
    // 🔎 FETCH ORDER FROM SQUARE
    // =================================
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
      console.warn("⚠️ Missing or invalid reference_id", orderData);
      return NextResponse.json({ ok: true });
    }

    const publicToken = referenceId.replace("INV-TOKEN-", "");

    // =================================
    // 🔎 BUSCAR INVOICE
    // =================================
    const invoice = await prisma.invoice.findUnique({
      where: { publicToken },
      include: {
        payments: true,
        job: true,
      },
    });

    if (!invoice) {
      console.warn("⚠️ Invoice not found for token:", publicToken);
      return NextResponse.json({ ok: true });
    }

    // =================================
    // 🛡️ DUPLICATE PROTECTION
    // =================================
    const exists = await prisma.invoicePayment.findUnique({
      where: { squarePaymentId: payment.id },
    });

    if (exists) {
      return NextResponse.json({ ok: true });
    }

    // =================================
    // 💰 AMOUNTS
    // =================================
    const amount = payment.amount_money.amount / 100;
    const processingFee =
      (payment.processing_fee?.[0]?.amount_money?.amount || 0) / 100;

    // =================================
    // 💾 CREATE PAYMENT
    // =================================
    await prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        processingFee,
        method: "Square",
        squarePaymentId: payment.id,
        note: "Square Payment Link",
        paidAt: new Date(payment.created_at),
      },
    });

    // =================================
    // 🔄 RECALC BALANCE
    // =================================
    const totalPaid =
      (invoice.payments ?? []).reduce((s, p) => s + p.amount, 0) + amount;

    const balance = Math.max(invoice.total - totalPaid, 0);

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        balance,
        status: balance === 0 ? "PAID" : "PARTIAL",
        paidAt: balance === 0 ? new Date() : null,
      },
    });

    // =================================
    // 🚚 AUTO MOVE JOB
    // =================================
    if (balance === 0 && invoice.job) {
      await prisma.job.update({
        where: { id: invoice.job.id },
        data: { status: "Production" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ Square webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 400 });
  }
}
