// app/api/invoices/summary/route.ts
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getInvoiceStatus } from "@/lib/invoiceStatus";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "thismonth";

  let startOfMonth: Date;
  let endOfMonth: Date;

  const now = new Date();

  // 🟢 THIS MONTH (MES ACTUAL REAL)
  if (filter === "thismonth") {
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  // 🟢 MES ESPECÍFICO (ej: 2026-0 = January 2026)
  else if (filter.includes("-")) {
    const [year, month] = filter.split("-").map(Number);
    startOfMonth = new Date(year, month, 1);
    endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
  }

  // 🟢 ALL TIME / FALLBACK
  else {
    startOfMonth = new Date(2000, 0, 1);
    endOfMonth = new Date(2100, 11, 31);
  }

  const invoices = await prisma.invoice.findMany({
    where: {
      paymentStatus: {
        not: "VOID",
      },
      issuedAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      invoiceItems: true,
      payments: true,
    },
  });

  let totalInvoices = 0;
  let paidInvoices = 0;
  let pendingInvoices = 0;
  let overdueInvoices = 0;

  for (const inv of invoices) {
    // SUBTOTAL
    const subtotal = inv.invoiceItems.reduce(
      (sum, item) =>
        sum +
        (item.total != null ? Number(item.total) : item.unitPrice * item.qty),
      0,
    );

    // TAX
    const taxRate = Number(inv.taxRate || 0);
    const tax = inv.taxEnabled && taxRate > 0 ? subtotal * (taxRate / 100) : 0;

    // TOTAL REAL
    const invoiceTotal = subtotal + tax;

    // PAYMENTS
    const paymentsTotal = inv.payments.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );

    const balance = invoiceTotal - paymentsTotal;

    const status = getInvoiceStatus({
      ...inv,
      invoiceTotal,
      paymentsTotal,
      balance,
    });

    // SUMAS
    totalInvoices += invoiceTotal;

    if (status === "Paid") {
      paidInvoices += invoiceTotal;
    }

    if (status === "Issued" || status === "Partially Paid") {
      pendingInvoices += balance;
    }

    if (status === "Overdue") {
      overdueInvoices += balance;
    }
  }

  return NextResponse.json({
    totalInvoices,
    paidInvoices,
    pendingInvoices,
    overdueInvoices,
  });
}
