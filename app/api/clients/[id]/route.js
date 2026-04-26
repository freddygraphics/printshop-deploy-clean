// /app/api/clients/[id]/route.tsexport const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import prisma from "../../../../lib/db";

// ðŸ“Œ GET â€” Cliente + quotes + orders + invoices (con pagos validados) + notes
export async function GET(req, { params }) {
  const id = parseInt(params.id);

  try {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 },
      );
    }

    const quotes = await prisma.quote.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    // ðŸ”¥ INVOICES CON PAGOS (CLAVE)
    const rawInvoices = await prisma.invoice.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      include: {
        payments: true, // ðŸ‘ˆ ESTO ES LO QUE FALTABA
      },
    });

    // ðŸ”¥ NORMALIZACIÃ“N CONTABLE (PRO)
    const invoices = rawInvoices.map((inv) => {
      const total = Number(inv.total || 0);

      const paid = inv.payments.reduce(
        (sum, p) => sum + Number(p.amount || 0),
        0,
      );

      const balance = Number((total - paid).toFixed(2));

      let status = "Issued";
      if (total === 0) status = "Draft";
      else if (paid === 0) status = "Issued";
      else if (paid > 0 && balance > 0) status = "Partially Paid";
      else if (balance <= 0) status = "Paid";

      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total,
        paid,
        balance,
        status,
        createdAt: inv.createdAt,
      };
    });

    const notes = await prisma.note.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      client,
      quotes,
      orders,
      invoices, // âœ… YA NORMALIZADAS
      notes,
    });
  } catch (error) {
    console.error("âŒ Error en GET /clients/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al obtener cliente" },
      { status: 500 },
    );
  }
}

export async function PUT(req, ctx) {
  try {
    const { id } = await ctx.params; // 👈 Next 15 fix
    const clientId = Number(id);

    if (!clientId) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();

    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: body.name || "",
        company: body.company || "",
        email: body.email || "",
        phone: body.phone || "",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ PUT /clients/[id]:", error);
    return NextResponse.json(
      { error: "Error updating client" },
      { status: 500 },
    );
  }
}
export async function DELETE(req, ctx) {
  try {
    const { id } = await ctx.params;
    const clientId = Number(id);

    await prisma.client.update({
      where: { id: clientId },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error deleting client" },
      { status: 500 },
    );
  }
}
