import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/db";

export const runtime = "nodejs";

// 🔐 Verificar firma Square
function verifySignature({ body, signature, url, secret }) {
  const payload = url + body;
  const hmac = crypto
    .createHmac("sha1", secret)
    .update(payload)
    .digest("base64");

  return hmac === signature;
}

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha1-signature");

  const secret = process.env.SQUARE_WEBHOOK_SECRET;
  const url = process.env.SQUARE_WEBHOOK_URL;

  if (!signature || !secret || !url) {
    return NextResponse.json(
      { error: "Missing webhook config" },
      { status: 400 },
    );
  }

  const isValid = verifySignature({
    body: rawBody,
    signature,
    url,
    secret,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // 🎯 SOLO pagos completados
  if (
    event.type === "payment.updated" &&
    event.data?.object?.payment?.status === "COMPLETED"
  ) {
    const payment = event.data.object.payment;

    const reference = payment.order_id || payment.reference_id;
    if (!reference || !reference.startsWith("INV-")) {
      return NextResponse.json({ ok: true });
    }

    const invoiceId = Number(reference.replace("INV-", ""));
    if (!invoiceId) return NextResponse.json({ ok: true });

    // 🔎 Buscar invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) return NextResponse.json({ ok: true });

    const amount = payment.amount_money.amount / 100;

    // 🧾 Crear payment
    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        method: "Square",
        note: "Paid via Square",
        paidAt: new Date(payment.created_at),
      },
    });

    // 💰 Recalcular balance
    const totalPaid =
      invoice.payments.reduce((s, p) => s + p.amount, 0) + amount;

    const balance = Math.max(invoice.total - totalPaid, 0);

    // 🏷️ Estado automático
    let paymentStatus = "Unpaid";
    if (balance === 0) paymentStatus = "Paid";
    else if (totalPaid > 0) paymentStatus = "Partially Paid";

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        balance,
        paymentStatus,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
