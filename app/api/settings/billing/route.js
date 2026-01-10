import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import crypto from "crypto";

// 🔒 normalizador de descuentos
function normalizeDiscountRules(rules = []) {
  const seen = new Set();

  return rules
    .map((d) => {
      const id = d.id && typeof d.id === "string" ? d.id : crypto.randomUUID(); // 👈 ID ÚNICO REAL

      return {
        id,
        name: String(d.name || "").trim(),
        description: d.description ? String(d.description) : null,
        type: d.type === "fixed" ? "fixed" : "percent",
        value: Number(d.value) || 0,
        active: d.active !== false,
      };
    })
    .filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
}

// GET SETTINGS
export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { error: "Failed to load settings" },
      { status: 500 }
    );
  }
}

// UPDATE SETTINGS
export async function PUT(req) {
  try {
    const body = await req.json();
    const existing = await prisma.settings.findFirst();

    const data = {
      taxEnabled: body.taxEnabled,
      defaultTaxRate: body.defaultTaxRate,
      defaultDepositPercent: body.defaultDepositPercent,

      // ✅ ARREGLO CLAVE
      discountRules: normalizeDiscountRules(body.discountRules),
      paymentFees: body.paymentFees ?? [],
    };

    const settings = existing
      ? await prisma.settings.update({
          where: { id: existing.id },
          data,
        })
      : await prisma.settings.create({ data });

    return NextResponse.json(settings);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
