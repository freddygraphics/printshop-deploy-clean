import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// ----------------------------------------
// GET — GET SINGLE INVOICE (CORREGIDO)
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

    // ⚠️ NO recalculamos descuentos aquí
    // ⚠️ NO tocamos appliedDiscounts
    // ⚠️ Devolvemos EXACTAMENTE lo que Prisma trae

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("❌ GET /api/invoices/[id] ERROR:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 },
    );
  }
}

// ----------------------------------------
// PATCH — UPDATE INVOICE (fechas / tax)
// ----------------------------------------
// ----------------------------------------
// PATCH — UPDATE INVOICE (fechas / tax / totales)
// ----------------------------------------
// ----------------------------------------
// PATCH — UPDATE INVOICE (fechas / tax / totales)
// ----------------------------------------
export async function PATCH(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 },
      );
    }

    const toNumber = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,

        taxEnabled:
          typeof body.taxEnabled === "boolean" ? body.taxEnabled : undefined,
        taxRate: toNumber(body.taxRate),

        // 🔥 EL ARREGLO
        subtotal: toNumber(body.subtotal),
        tax: toNumber(body.tax),
        total: toNumber(body.total),
        balance: toNumber(body.balance),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ PATCH /api/invoices/[id] ERROR:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 },
    );
  }
}
