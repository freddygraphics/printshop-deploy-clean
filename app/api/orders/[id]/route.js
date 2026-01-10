// /app/api/orders/[id]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../lib/db";

// 📋 GET - obtener una orden por ID
export async function GET(req, { params }) {
  const id = parseInt(params.id);
  const order = await prisma.order.findUnique({
    where: { id },
    include: { client: true, product: true, invoice: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
  }

  return NextResponse.json(order);
}

// ✏️ PUT - actualizar orden
export async function PUT(req, { params }) {
  const id = parseInt(params.id);
  const data = await req.json();

  try {
    const updated = await prisma.order.update({
      where: { id },
      data,
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar orden" }, { status: 500 });
  }
}

// ❌ DELETE - eliminar orden
export async function DELETE(req, { params }) {
  const id = parseInt(params.id);

  try {
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ message: "Orden eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar orden" }, { status: 500 });
  }
}
