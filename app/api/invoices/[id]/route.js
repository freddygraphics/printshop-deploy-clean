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
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        payments: true,
        invoiceItems: {
          include: {
            product: true,
          },
        },

        // 🔥 CLAVE DEL PROBLEMA — ESTO FALTABA
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
      { status: 500 }
    );
  }
}

// ----------------------------------------
// PATCH — UPDATE INVOICE (fechas / tax)
// ----------------------------------------
export async function PATCH(req, { params }) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 }
      );
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        issuedAt: body.issuedAt ? new Date(body.issuedAt) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        taxEnabled:
          typeof body.taxEnabled === "boolean" ? body.taxEnabled : undefined,
        taxRate: typeof body.taxRate === "number" ? body.taxRate : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ PATCH /api/invoices/[id] ERROR:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
