"use client";

export const dynamic = "force-dynamic";
import { NextResponse } from "next/server"; // ✅ ESTA LÍNEA FALTABA

import prisma from "@/lib/db";

export async function PATCH(req, { params }) {
  try {
    const invoiceId = Number(params.id);
    const { discount } = await req.json();

    console.log("🔥 DISCOUNT RECEIVED:", discount);

    // 1️⃣ borrar descuentos previos
    await prisma.invoiceDiscount.deleteMany({
      where: { invoiceId },
    });

    // 2️⃣ si no hay descuento → OK
    if (!discount) {
      return NextResponse.json({ ok: true });
    }

    // 3️⃣ crear nuevo descuento
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
    console.error("❌ DISCOUNT SAVE ERROR:", err);
    return NextResponse.json(
      { error: "Failed to save discount" },
      { status: 500 },
    );
  }
}
