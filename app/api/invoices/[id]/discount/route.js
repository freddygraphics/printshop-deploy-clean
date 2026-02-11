export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"; // âœ… ESTA LÃNEA FALTABA

import prisma from "@/lib/db";

export async function PATCH(req, { params }) {
  try {
    const invoiceId = Number(params.id);
    const { discount } = await req.json();

    console.log("ðŸ”¥ DISCOUNT RECEIVED:", discount);

    // 1ï¸âƒ£ borrar descuentos previos
    await prisma.invoiceDiscount.deleteMany({
      where: { invoiceId },
    });

    // 2ï¸âƒ£ si no hay descuento â†’ OK
    if (!discount) {
      return NextResponse.json({ ok: true });
    }

    // 3ï¸âƒ£ crear nuevo descuento
    await prisma.invoiceDiscount.create({
      data: {
        invoiceId,
        discountId: discount.id,
        type: discount.type,
        value: discount.value,
        amount: discount.amount,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("âŒ DISCOUNT SAVE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save discount" },
      { status: 500 },
    );
  }
}

