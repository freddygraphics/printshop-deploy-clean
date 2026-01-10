// /app/api/clients/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

// 📌 GET — Cliente + quotes + orders + invoices + notes
export async function GET(req, { params }) {
  const id = parseInt(params.id);

  try {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
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

    const invoices = await prisma.invoice.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    const notes = await prisma.note.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      client,
      quotes,
      orders,
      invoices,
      notes,
    });
  } catch (error) {
    console.error("❌ Error en GET /clients/[id]:", error);
    return NextResponse.json(
      { error: "Error interno al obtener cliente" },
      { status: 500 }
    );
  }
}

// ✏️ PUT — actualizar cliente
export async function PUT(req, { params }) {
  const id = parseInt(params.id);
  const data = await req.json();

  try {
    const updated = await prisma.client.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    );
  }
}

// ❌ DELETE — eliminar cliente
export async function DELETE(req, { params }) {
  const id = parseInt(params.id);

  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ message: "Cliente eliminado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    );
  }
}
