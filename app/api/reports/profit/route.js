import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        AND: [
          {
            status: {
              not: "VOID",
            },
          },
          {
            balance: {
              lte: 0.01,
            },
          },
          {
            total: {
              gt: 0,
            },
          },
        ],
      },

      orderBy: {
        issuedAt: "desc",
      },

      include: {
        client: true,

        invoiceItems: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    const report = invoices.map((invoice) => {
      const items = invoice.invoiceItems || [];

      const hasItems = items.length > 0;

      const costsCompleted =
        hasItems && items.every((item) => item.totalCost !== null);

      const completedItems = items.filter(
        (item) => item.totalCost !== null,
      ).length;

      const pendingItems = items.filter(
        (item) => item.totalCost === null,
      ).length;

      const totalCost = items.reduce(
        (sum, item) => sum + Number(item.totalCost ?? 0),
        0,
      );

      // El subtotal no incluye impuestos
      const salesAmount = Number(invoice.subtotal || 0);

      const profit = costsCompleted ? salesAmount - totalCost : null;

      const profitMargin =
        costsCompleted && salesAmount > 0 ? (profit / salesAmount) * 100 : null;

      return {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issuedAt: invoice.issuedAt,
        createdAt: invoice.createdAt,
        dueDate: invoice.dueDate,
        status: invoice.status,
        paymentStatus: invoice.paymentStatus,

        client: invoice.client
          ? {
              id: invoice.client.id,
              name: invoice.client.company || invoice.client.name || "Customer",
            }
          : null,

        subtotal: salesAmount,
        tax: Number(invoice.tax || 0),
        total: Number(invoice.total || 0),
        balance: Number(invoice.balance || 0),

        itemCount: items.length,
        completedItems,
        pendingItems,
        costsCompleted,

        totalCost: costsCompleted ? totalCost : null,
        enteredCost: totalCost,
        profit,
        profitMargin,
      };
    });

    const completedInvoices = report.filter(
      (invoice) => invoice.costsCompleted,
    );

    const summary = completedInvoices.reduce(
      (totals, invoice) => {
        totals.sales += Number(invoice.subtotal || 0);
        totals.cost += Number(invoice.totalCost || 0);
        totals.profit += Number(invoice.profit || 0);

        return totals;
      },
      {
        sales: 0,
        cost: 0,
        profit: 0,
      },
    );

    const averageMargin =
      summary.sales > 0 ? (summary.profit / summary.sales) * 100 : 0;

    return NextResponse.json({
      summary: {
        totalInvoices: report.length,
        completedInvoices: completedInvoices.length,
        pendingInvoices: report.length - completedInvoices.length,

        sales: summary.sales,
        cost: summary.cost,
        profit: summary.profit,
        averageMargin,
      },

      invoices: report,
    });
  } catch (error) {
    console.error("GET /api/reports/profit ERROR:", error);

    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
