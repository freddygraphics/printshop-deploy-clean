import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

// ----------------------------------------
// GET â€” GET SINGLE INVOICE (CORREGIDO)
// ----------------------------------------
export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
        invoiceItems: {
          include: { product: true },
        },
        appliedDiscounts: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // âš ï¸ NO recalculamos descuentos aquÃ­
    // âš ï¸ NO tocamos appliedDiscounts
    // âš ï¸ Devolvemos EXACTAMENTE lo que Prisma trae

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("âŒ GET /api/invoices/[id] ERROR:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 },
    );
  }
}

// ----------------------------------------
// PATCH â€” UPDATE INVOICE (fechas / tax)
// ----------------------------------------
// ----------------------------------------
// PATCH â€” UPDATE INVOICE (fechas / tax / totales)
// ----------------------------------------
// ----------------------------------------
// PATCH â€” UPDATE INVOICE (fechas / tax / totales)
// ----------------------------------------
export async function PATCH(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 },
      );
    }

    const toNumber = (value) => {
      const number = Number(value);

      return Number.isFinite(number) ? number : undefined;
    };

    const clientId = Number(body.clientId);

    const updatedInvoice = await prisma.invoice.update({
      where: {
        id,
      },

      data: {
        // Guardar el nuevo cliente
        clientId:
          Number.isInteger(clientId) && clientId > 0 ? clientId : undefined,

        issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,

        dueDate: Object.prototype.hasOwnProperty.call(body, "dueDate")
          ? body.dueDate
            ? new Date(body.dueDate)
            : null
          : undefined,

        taxEnabled:
          typeof body.taxEnabled === "boolean" ? body.taxEnabled : undefined,

        taxRate: toNumber(body.taxRate),
        subtotal: toNumber(body.subtotal),
        tax: toNumber(body.tax),
        total: toNumber(body.total),
        balance: toNumber(body.balance),
      },

      include: {
        client: true,
      },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error("❌ PATCH /api/invoices/[id] ERROR:", error);

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
