export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// ============================
// GET – Payment History
// ============================
export async function GET(req, { params }) {
  const invoiceId = Number(params.id);

  if (!Number.isFinite(invoiceId)) {
    return NextResponse.json([], { status: 200 });
  }

  const payments = await prisma.invoicePayment.findMany({
    where: { invoiceId },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json(payments);
}

// ============================
// POST – Record Payment
// ============================
export async function POST(req, { params }) {
  try {
    const invoiceId = Number(params.id);

    if (!Number.isFinite(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 },
      );
    }

    const body = await req.json();
    console.log("💰 PAYMENT BODY:", body);

    const {
      amount, // 👈 customer paid (incluye fee)
      amountTotal,
      paymentMethod,
      method,
      processingFee = 0,
      note,
    } = body;

    const finalAmount = Number(amount ?? amountTotal);
    const finalMethod = paymentMethod ?? method ?? "Unknown";

    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1️⃣ Obtener invoice (ANTES de usarla)
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 2️⃣ Guardar pago (customer paid)
    await prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount: finalAmount, // total charged
        processingFee,
        method: finalMethod,
        note,
      },
    });

    // 3️⃣ Recalcular pagos
    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId },
    });

    const totalApplied = payments.reduce(
      (sum, p) => sum + (p.amount - (p.processingFee || 0)),
      0,
    );

    const balance = invoice.total - totalApplied;

    // 4️⃣ Status
    let paymentStatus = "Unpaid";
    let paidAt = null;

    if (balance <= 0) {
      paymentStatus = "Paid";
      paidAt = new Date();
    } else if (totalApplied > 0) {
      paymentStatus = "Partially Paid";
    }

    // 5️⃣ Update invoice
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        balance,
        paymentStatus,
        paidAt,
      },
    });

    return NextResponse.json({
      success: true,
      totalApplied, // 👈 lo que cubre el invoice
      balance,
      paymentStatus,
    });
  } catch (error) {
    console.error("❌ Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
