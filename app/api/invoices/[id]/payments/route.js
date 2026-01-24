import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// ============================
// GET – Payment History
// ============================
export async function GET(req, { params }) {
  const invoiceId = Number(params.id);

  const payments = await prisma.invoicePayment.findMany({
    where: { invoiceId },
    orderBy: { paidAt: "desc" },
  });

  return NextResponse.json(payments);
}

// ============================
// POST – Record Payment
// ============================
// ============================
// POST – Record Payment
// ============================
export async function POST(req, { params }) {
  try {
    const invoiceId = Number(params.id);
    const body = await req.json();
    const {
      amount,
      amountTotal,
      paymentMethod,
      method,
      processingFee = 0,
      note,
    } = body;

    const finalAmount = amount; // 👈 NO amountTotal

    const finalMethod = paymentMethod ?? method;

    if (!finalAmount || finalAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await prisma.invoicePayment.create({
      data: {
        invoiceId,
        amount: finalAmount, // TOTAL cobrado al cliente
        processingFee, // 🆕 guardado
        method: finalMethod,
        note,
      },
    });

    // 2️⃣ Total pagado
    const paymentsAgg = await prisma.invoicePayment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });

    const totalPaid = paymentsAgg._sum.amount || 0;

    // 3️⃣ Obtener invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 4️⃣ Calcular balance y status
    const balance = invoice.total - totalPaid;

    let paymentStatus = "Unpaid";
    let paidAt = null;

    if (balance <= 0) {
      paymentStatus = "Paid";
      paidAt = new Date();
    } else if (totalPaid > 0) {
      paymentStatus = "Partially Paid";
    }

    // 5️⃣ ACTUALIZAR INVOICE (🔥 CLAVE)
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
      totalPaid,
      balance,
      paymentStatus,
    });
  } catch (error) {
    console.error("❌ Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 500 });
  }
}
