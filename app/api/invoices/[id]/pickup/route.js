import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

import prisma from "@/lib/db";

export async function POST(req, { params }) {
  try {
    const invoiceId = Number(params.id);

    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 },
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // 🔒 Solo si está completamente pagada
    if (Number(invoice.balance ?? 0) > 0) {
      return NextResponse.json(
        { error: "Invoice not fully paid" },
        { status: 400 },
      );
    }

    // 🚫 Evitar doble pickup
    if (invoice.pickedUpAt) {
      return NextResponse.json(
        { error: "Invoice already picked up" },
        { status: 400 },
      );
    }

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        pickedUpAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("❌ PICKUP ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
