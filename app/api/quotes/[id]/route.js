import { NextResponse } from "next/server";
import prisma from "../../../../lib/db"; // ✔ ruta correcta


// -------------------------------------
// GET /api/quotes/[id]
// -------------------------------------
export async function GET(req, { params }) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("❌ ERROR LOADING QUOTE:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}

// -------------------------------------
// PATCH /api/quotes/[id]
// Actualiza: cliente, items, subtotal, tax, total, status, notes
// -------------------------------------
export async function PUT(req, { params }) {

  try {
    const id = Number(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();

    const {
      clientId,
      items = [],
      subtotal,
      tax,
      total,
      status,
      
      customerNotes,
    } = body;

    // 🔥 1) BORRAR ITEMS ANTERIORES
    await prisma.quoteItem.deleteMany({
      where: { quoteId: id },
    });

    // 🔥 2) CREAR ITEMS NUEVOS (COMPLETOS)
    if (!Array.isArray(items) || items.length === 0) {
  return NextResponse.json(
    { error: "Quote must have at least one item" },
    { status: 400 }
  );
}

    if (items.length > 0) {
await prisma.quoteItem.createMany({
  data: items.map((i, index) => ({
    quoteId: id,
    productId: i.productId ?? null,

    name:
      (typeof i.name === "string" && i.name.trim()) ||
      (typeof i.description === "string" && i.description.trim()) ||
      `Manual Item ${index + 1}`,

    qty: Number(i.qty) > 0 ? Number(i.qty) : 1,
    unitPrice: Number(i.unitPrice) > 0 ? Number(i.unitPrice) : 0,
    total:
      Number(i.total) > 0
        ? Number(i.total)
        : (Number(i.qty) || 1) * (Number(i.unitPrice) || 0),

    options: i.options || {},
    notes: i.notes || null,
  })),
});


    }
    const dataToUpdate = {};

if (typeof clientId === "number") dataToUpdate.clientId = clientId;
if (typeof subtotal === "number") dataToUpdate.subtotal = subtotal;
if (typeof tax === "number") dataToUpdate.tax = tax;
if (typeof total === "number") dataToUpdate.total = total;
if (typeof status === "string") dataToUpdate.status = status;
if (typeof customerNotes === "string") dataToUpdate.customerNotes = customerNotes;


    // 🔥 3) ACTUALIZAR EL QUOTE
    const updatedQuote = await prisma.quote.update({
      where: { id },
      data: {
        clientId,
        subtotal,
        tax,
        total,
        status,
      
        customerNotes,
      },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error("❌ ERROR UPDATING QUOTE:", error);
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
}
// -------------------------------------
// DELETE /api/quotes/[id]
// Void / eliminar quote
// -------------------------------------
export async function DELETE(req, { params }) {
  try {
    const id = Number(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    // 1️⃣ Borrar items del quote
    await prisma.quoteItem.deleteMany({
      where: { quoteId: id },
    });

    // 2️⃣ Borrar jobs asociados (si existen)
    await prisma.job.deleteMany({
      where: { quoteId: id },
    });

    // 3️⃣ Borrar invoices asociadas (si existen)
    await prisma.invoice.deleteMany({
      where: { quoteId: id },
    });

    // 4️⃣ Borrar el quote
    await prisma.quote.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ ERROR VOIDING QUOTE:", error);
    return NextResponse.json(
      { error: "Error voiding quote" },
      { status: 500 }
    );
  }
}


