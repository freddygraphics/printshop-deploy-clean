import { NextResponse } from "next/server";
import { priceFromPrintProfileSqft } from "@/lib/pricing/pricingEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      pricingMode,
      qty,

      // manual
      unitPrice,

      // sqft
      widthIn,
      heightIn,
    } = body;

    if (!pricingMode || !qty) {
      return NextResponse.json(
        { error: "pricingMode and qty are required" },
        { status: 400 },
      );
    }

    switch (pricingMode) {
      // =========================
      // MANUAL PREVIEW
      // =========================
      case "manual": {
        if (unitPrice == null) {
          return NextResponse.json(
            { error: "unitPrice required for manual preview" },
            { status: 400 },
          );
        }

        const subtotal = unitPrice * qty;

        return NextResponse.json({
          mode: "manual",
          qty,
          unitPrice,
          subtotal,
        });
      }

      // =========================
      // CONFIGURABLE PREVIEW
      // =========================
      case "configurable": {
        // 👉 aquí puedes reutilizar TU lógica actual si quieres
        const subtotal = unitPrice * qty;

        return NextResponse.json({
          mode: "configurable",
          qty,
          unitPrice,
          subtotal,
        });
      }

      // =========================
      // SQFT PREVIEW
      // =========================
      case "sqft": {
        if (!widthIn || !heightIn) {
          return NextResponse.json(
            { error: "widthIn and heightIn required for sqft preview" },
            { status: 400 },
          );
        }

        const breakdown = await priceFromPrintProfileSqft({
          printProductionProfileId: "BANNER_SQFT_ID",
          widthIn,
          heightIn,
          quantity: qty,
        });

        return NextResponse.json({
          mode: "sqft",
          sqft: breakdown.unitQty,

          qty,
          subtotal: breakdown.subtotal,
          breakdown,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid pricingMode" },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error("❌ Pricing preview error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
