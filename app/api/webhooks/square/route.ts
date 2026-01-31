import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// ================================
// 🔐 Verify Square Signature (SHA1)
// ================================
// 🔐 Verify Square Signature (SHA256)
function verifySignature(
  body: string,
  signature: string,
  url: string,
  secret: string,
) {
  const payload = url + body;

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

// ================================
// POST — WEBHOOK
// ================================
export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const secret = process.env.SQUARE_WEBHOOK_SECRET!;
    if (!secret) {
      return NextResponse.json({ error: "Missing secret" }, { status: 500 });
    }

    // 🔥 CLAVE: usar la URL REAL del request
    const url = "https://app.freddygraphics.com/api/webhooks/square";

    const isValid = verifySignature(body, signature, url, secret);

    if (!isValid) {
      console.error("❌ Invalid Square signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Solo pagos
    if (!event.type?.startsWith("payment.")) {
      return NextResponse.json({ ok: true });
    }

    const payment = event.data?.object?.payment;
    if (!payment || payment.status !== "COMPLETED") {
      return NextResponse.json({ ok: true });
    }

    // ================================
    // reference_id → publicToken
    // ================================
    const referenceId = payment.reference_id;
    if (!referenceId || !referenceId.startsWith("INV-TOKEN-")) {
      return NextResponse.json({ ok: true });
    }

    const publicToken = referenceId.replace("INV-TOKEN-", "");

    const invoice = await prisma.invoice.findUnique({
      where: { publicToken },
      include: { payments: true, job: true },
    });

    if (!invoice) return NextResponse.json({ ok: true });

    // ================================
    // DUPLICATE PROTECTION
    // ================================
    const exists = await prisma.invoicePayment.findUnique({
      where: { squarePaymentId: payment.id },
    });

    if (exists) return NextResponse.json({ ok: true });

    // ================================
    // AMOUNTS
    // ================================
    const amount = payment.amount_money.amount / 100;
    const processingFee =
      (payment.processing_fee?.[0]?.amount_money?.amount || 0) / 100;

    // ================================
    // CREATE PAYMENT
    // ================================
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

    // ================================
    // RECALC BALANCE
    // ================================
    const totalPaid =
      invoice.payments.reduce((s, p) => s + p.amount, 0) + amount;

    const balance = Math.max(invoice.total - totalPaid, 0);

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        balance,
        status: balance === 0 ? "PAID" : "PARTIAL",
        paidAt: balance === 0 ? new Date() : null,
        squarePaymentId: payment.id,
      },
    });

    // ================================
    // AUTO MOVE JOB
    // ================================
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
