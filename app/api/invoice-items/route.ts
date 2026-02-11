export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { calcSqft } from "@/lib/pricing/pricingEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      invoiceId,
      productId,
      name,
      pricingMode,
      qty,

      unitPrice,
      options,

      widthIn,
      heightIn,
    } = body;

    if (!invoiceId || !name || !pricingMode || !qty) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 🔒 CANAL ÚNICO DE DECISIÓN
    switch (pricingMode) {
      // =========================
      // MANUAL (NO TOCAR)
      // =========================
      case "manual": {
        if (unitPrice == null) {
          return NextResponse.json(
            { error: "unitPrice required for manual pricing" },
            { status: 400 },
          );
        }

        const total = qty * unitPrice;

        const item = await prisma.invoiceItem.create({
          data: {
            invoiceId,
            productId,
            name,
            pricingMode: "manual",
            qty,
            unitPrice,
            total,
          },
        });

        return NextResponse.json(item);
      }

      // =========================
      // CONFIGURABLE (NO TOCAR)
      // =========================
      case "configurable": {
        if (!options) {
          return NextResponse.json(
            { error: "options required for configurable pricing" },
            { status: 400 },
          );
        }

        // ⛔ AQUÍ VA TU LÓGICA ACTUAL
        // 👇 EJEMPLO (no la cambio)
        const total = unitPrice * qty;

        const item = await prisma.invoiceItem.create({
          data: {
            invoiceId,
            productId,
            name,
            pricingMode: "configurable",
            qty,
            unitPrice,
            total,
            options,
          },
        });

        return NextResponse.json(item);
      }

      // =========================
      // SQFT (NUEVO, AISLADO)
      // =========================
      case "sqft": {
        if (!widthIn || !heightIn) {
          return NextResponse.json(
            { error: "widthIn and heightIn required for sqft pricing" },
            { status: 400 },
          );
        }

        const sqft = calcSqft(widthIn, heightIn);

        const breakdown = {
          mode: "sqft",
          unitQty: sqft,
          unitPrice: unitPrice, // de tu lógica existente
          subtotal: sqft * unitPrice,
          lines: [],
        };

        const unit = breakdown.subtotal / qty;

        const item = await prisma.invoiceItem.create({
          data: {
            invoiceId,
            productId,
            name,
            pricingMode: "sqft",

            qty,
            unitPrice: unit,
            total: breakdown.subtotal,

            widthIn,
            heightIn,
            sqft: breakdown.unitQty,

            priceSnapshot: breakdown,
          },
        });

        return NextResponse.json(item);
      }

      default:
        return NextResponse.json(
          { error: "Invalid pricingMode" },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error("❌ InvoiceItem error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
