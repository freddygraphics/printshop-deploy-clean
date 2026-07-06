export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { priceFromPrintProfileSqft } from "@/lib/pricing/pricingEngine";

export async function PUT(req, { params }) {
  const invoiceId = Number(params.id);

  if (!invoiceId) {
    return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
  }

  const body = await req.json();

  console.log("🔥 SAVE ITEMS");
  console.log(body);

  const items = body.items || [];

  try {
    // ðŸ”¥ 1. BORRAR ITEMS EXISTENTES
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    // ðŸ”¥ 2. RECREAR ITEMS (UNO POR UNO)
    for (const i of items) {
      console.log("Saving:", i.name);
      const pricingMode = i.options?.pricingMode;

      // ============================
      // ðŸŸ¢ ITEM MANUAL / LEGACY
      // ============================
      if (pricingMode !== "sqft") {
        await prisma.invoiceItem.create({
          data: {
            invoiceId,
            productId: i.productId ?? null,
            name: i.name,
            qty: Number(i.qty),
            unitPrice: Number(i.unitPrice),
            total: Number(i.total),
            options: i.options ?? {},
          },
        });

        continue;
      }

      // ============================
      // ðŸ”µ ITEM SQFT (CONFIGURABLE)
      // ============================
      const material = await prisma.material.findUnique({
        where: { id: i.options.materialId },
      });

      if (!material) {
        throw new Error(`Material not found: ${i.options.materialId}`);
      }

      const breakdown = await priceFromPrintProfileSqft({
        printProductionProfileId: i.printProductionProfileId,
        widthIn: Number(i.options.widthIn),
        heightIn: Number(i.options.heightIn),
        quantity: Number(i.qty),
      });

      await prisma.invoiceItem.create({
        data: {
          invoiceId,
          productId: i.productId ?? null,
          name: i.name,
          qty: Number(i.qty),

          // âœ… PRECIO CORRECTO
          unitPrice: breakdown.subtotal / Number(i.qty),
          total: breakdown.subtotal,

          // ðŸ”¥ SNAPSHOT REAL (NO SE VUELVE A CALCULAR)
          options: {
            ...i.options,
            pricingSnapshot: breakdown,
          },
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("âŒ SAVE ITEMS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save items" },
      { status: 500 },
    );
  }
}
