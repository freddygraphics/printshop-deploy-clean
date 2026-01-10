import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req) {
  try {
    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "orderId and status are required" },
        { status: 400 }
      );
    }

    // Actualizar el estado
    await prisma.order.update({
      where: { id: Number(orderId) },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ Error moving order:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
