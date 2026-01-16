import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PUT(req, { params }) {
  const invoiceId = Number(params.id);
  if (!invoiceId) {
    return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
  }

  const body = await req.json();
  const items = body.items || [];

  try {
    // 🔥 BORRA ITEMS EXISTENTES
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    // 🔥 CREA NUEVOS ITEMS (CON OPTIONS)
    await prisma.invoiceItem.createMany({
      data: items.map((i) => ({
        invoiceId,
        productId: i.productId ?? null,
        name: i.name,
        qty: Number(i.qty),
        unitPrice: Number(i.unitPrice),
        total: Number(i.total),
        options: i.options ?? {}, // 👈 GUARDA JSON
      })),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ SAVE ITEMS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save items" },
      { status: 500 }
    );
  }
}
