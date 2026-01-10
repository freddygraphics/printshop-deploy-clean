import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";


export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: "asc",
      },
      include: {
        client: true,
        product: true,
      },
    });

    // Mapeamos al formato que usa el frontend
    const formatted = orders.map((o) => ({
      id: o.id,
      status: o.status,
      priority: o.priority,
      dueDate: o.dueDate,
      notes: o.notes,
      workflow: o.workflow,
      customFields: o.customFields,

      // Datos del cliente
      clientName: o.client?.name || null,

      // Datos del producto
      productName: o.product?.name || null,

      // Sistema
      createdAt: o.createdAt,
    }));

    return NextResponse.json(formatted);
  } catch (err) {
    console.error("❌ Error loading board:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
