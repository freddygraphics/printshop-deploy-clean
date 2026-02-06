import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/db";

export async function GET(req, { params }) {
  const { token } = params;

  const job = await prisma.job.findUnique({
    where: { pickupToken: token },
    include: {
      client: true,
      invoice: {
        include: {
          invoiceItems: true,
          payments: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json(
      { error: "Invalid pickup token" },
      { status: 404 },
    );
  }

  // 🧮 Calcular balance real
  const subtotal = job.invoice.invoiceItems.reduce(
    (sum, i) => sum + Number(i.total ?? i.unitPrice * i.qty),
    0,
  );

  const paymentsTotal = job.invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  const balance = subtotal - paymentsTotal;

  return NextResponse.json({
    job,
    balance,
  });
}

// ------------------------------------------------
// POST — MARK JOB AS DELIVERED
// ------------------------------------------------
export async function POST(req, { params }) {
  const { token } = params;

  const job = await prisma.job.findUnique({
    where: { pickupToken: token },
    include: {
      invoice: {
        include: {
          invoiceItems: true,
          payments: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json(
      { error: "Invalid pickup token" },
      { status: 404 },
    );
  }

  // 🧮 RECALCULAR BALANCE (IGUAL QUE EN GET)
  const subtotal = job.invoice.invoiceItems.reduce(
    (sum, i) => sum + Number(i.total ?? i.unitPrice * i.qty),
    0,
  );

  const paymentsTotal = job.invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );

  const balance = subtotal - paymentsTotal;

  // ❌ BLOQUEAR SI HAY BALANCE
  if (balance > 0) {
    return NextResponse.json(
      { error: "Invoice has pending balance" },
      { status: 400 },
    );
  }

  // ✅ MARCAR COMO DELIVERED
  const updated = await prisma.job.update({
    where: { id: job.id },
    data: {
      status: "Delivered",
      pickedUpAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
