import { NextResponse } from "next/server";
import prisma from "../../../../lib/db"; // ⭐ Instancia global segura

// ----------------------------------------------------

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
      select: {
        id: true,
        invoiceNumber: true,
        issuedAt: true,
        dueDate: true,
        subtotal: true,
        tax: true,
        total: true,
        paymentStatus: true,
        notes: true,
        qrToken: true,
        client: true,
        payments: true,
        invoiceItems: {
          include: { product: true },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (err) {
    console.error("❌ GET /api/invoices/[id] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ----------------------------------------------------
// PATCH /api/invoices/[id]
// Update cliente, items, subtotal, tax, total, status
// ----------------------------------------------------
export async function PUT(req, { params }) {
  try {
    const id = Number(params.id);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid Invoice ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      clientId,
      items,
      subtotal,
      tax,
      total,
      notes,
      paymentStatus,
      dueDate,
      isVoided,
    } = body || {};

    // ----------------------------------------
    // 1. ACTUALIZAR ITEMS (invoiceItems)
    // ----------------------------------------
    // ----------------------------------------
    // 1. ACTUALIZAR ITEMS (SIN DUPLICAR)
    // ----------------------------------------
    if (Array.isArray(items)) {
      // 🔥 borrar items anteriores
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      if (items.length > 0) {
        await prisma.invoiceItem.createMany({
          data: items.map((item) => ({
            invoiceId: id,
            name: item.name || "",
            qty: Number(item.qty || 1),
            unitPrice: Number(item.unitPrice || 0),
            total: Number(item.total || 0),
            productId: item.productId || null,
          })),
        });
      }
    }

    // ----------------------------------------
    // 2. ACTUALIZAR INVOICE (subtotal, cliente, etc.)
    // ----------------------------------------
    const updateData = {};

    if (typeof clientId === "number") updateData.clientId = clientId;
    if (typeof subtotal === "number") updateData.subtotal = subtotal;
    if (typeof tax === "number") updateData.tax = tax;
    if (typeof total === "number") updateData.total = total;
    if (typeof notes === "string") updateData.notes = notes;
    if (typeof paymentStatus === "string")
      updateData.paymentStatus = paymentStatus;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (body.isVoided === true) {
      updateData.isVoided = true;
      updateData.paymentStatus = "Voided";
    }

    // Ejecutar update
    if (typeof total === "number") {
      updateData.balance = total;
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        invoiceItems: true,
        quote: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ ERROR UPDATING INVOICE:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
// ----------------------------------------------------
// PATCH /api/invoices/[id]  → VOID INVOICE
// ----------------------------------------------------
export async function PATCH(req, { params }) {
  try {
    const id = Number(params.id);

    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid Invoice ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (body.isVoided !== true) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        isVoided: true,
        paymentStatus: "Voided",
        balance: 0,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ ERROR VOIDING INVOICE:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
