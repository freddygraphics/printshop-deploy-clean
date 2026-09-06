export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

/* ======================================================
   GET — Cliente + quotes + orders + invoices + notes
====================================================== */

export async function GET(req, ctx) {
  const { id } = await ctx.params;
  const clientId = Number(id);

  if (!clientId) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    const quotes = await prisma.quote.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    /* ======================================================
       INVOICES + PAYMENTS
    ====================================================== */

    const rawInvoices = await prisma.invoice.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      include: {
        payments: true,
      },
    });

    /* ======================================================
       NORMALIZACIÓN CONTABLE
    ====================================================== */

    const invoices = rawInvoices.map((inv) => {
      const total = Number(inv.total || 0);

      const paid = inv.payments.reduce(
        (sum, payment) => sum + Number(payment.amount || 0),
        0,
      );

      const rawBalance = Number((total - paid).toFixed(2));

      const balance = rawBalance <= 0.01 ? 0 : rawBalance;

      /* ==================================================
         STATUS REAL DEL INVOICE
         Aquí usamos Invoice.status, NO paymentStatus
      ================================================== */

      const invoiceStatus = String(inv.status || "")
        .trim()
        .toUpperCase();

      const paymentStatus = String(inv.paymentStatus || "")
        .trim()
        .toUpperCase();
      let status = "Issued";

      /*
  1. VOID tiene prioridad absoluta
*/
      if (invoiceStatus === "VOID" || inv.voidedAt) {
        status = "Void";
      } else if (total > 0 && paid > 0 && balance <= 0.01) {
        /*
  2. PAID
  Si los pagos cubren el total, es Paid.
*/
        status = "Paid";
      } else if (total > 0 && paid > 0 && balance > 0.01) {
        /*
  3. PARTIALLY PAID
*/
        status = "Partially Paid";
      } else if (paymentStatus === "OVERDUE") {
        /*
  4. OVERDUE
*/
        status = "Overdue";
      } else if (paymentStatus === "DRAFT" || total <= 0) {
        /*
  5. DRAFT
*/
        status = "Draft";
      } else {
        /*
  6. ISSUED / UNPAID
*/
        status = "Issued";
      }
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,

        total,

        paid,

        // Un invoice VOID nunca genera deuda
        balance: status === "Void" ? 0 : balance,

        // Status normalizado para Customer Profile
        status,

        // Dejamos los valores originales para debugging
        paymentStatus: inv.paymentStatus,
        invoiceStatus: inv.status,

        voidedAt: inv.voidedAt,
        voidReason: inv.voidReason,

        issuedAt: inv.issuedAt,
        createdAt: inv.createdAt,
      };
    });

    /* ======================================================
       NOTES
    ====================================================== */

    const notes = await prisma.note.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });

    /* ======================================================
       RESPONSE
    ====================================================== */

    return NextResponse.json({
      client,
      quotes,
      orders,
      invoices,
      notes,
    });
  } catch (error) {
    console.error("❌ Error GET /api/clients/[id]:", error);

    return NextResponse.json(
      {
        error: "Error interno al obtener cliente",
      },
      { status: 500 },
    );
  }
}

/* ======================================================
   PUT — Actualizar cliente
====================================================== */

export async function PUT(req, ctx) {
  try {
    const { id } = await ctx.params;
    const clientId = Number(id);

    if (!clientId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();

    const updated = await prisma.client.update({
      where: {
        id: clientId,
      },

      data: {
        name: body.name || "",
        company: body.company || "",
        email: body.email || "",
        phone: body.phone || "",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ PUT /api/clients/[id]:", error);

    return NextResponse.json(
      {
        error: "Error updating client",
      },
      { status: 500 },
    );
  }
}

/* ======================================================
   DELETE — Soft delete
====================================================== */

export async function DELETE(req, ctx) {
  try {
    const { id } = await ctx.params;
    const clientId = Number(id);

    if (!clientId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.client.update({
      where: {
        id: clientId,
      },

      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("❌ DELETE /api/clients/[id]:", error);

    return NextResponse.json(
      {
        error: "Error deleting client",
      },
      { status: 500 },
    );
  }
}
