// /app/api/orders/status/[status]/route.js
import { NextResponse } from "next/server";
import prisma from "../../../../../lib/db";

// 📋 GET - listar órdenes por estado
export async function GET(req, { params }) {
  const status = decodeURIComponent(params.status);

  try {
    const orders = await prisma.order.findMany({
      where: { status },
      include: { client: true, product: true, invoice: true },
      orderBy: { createdAt: "desc" },
    });

    if (orders.length === 0) {
      return NextResponse.json({ message: "No hay órdenes con este estado" });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al filtrar órdenes" }, { status: 500 });
  }
}
