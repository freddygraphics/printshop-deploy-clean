import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // 1) billing settings (deposit/tax)
    const billing = await prisma.settings.findFirst();

    // 2) discounts list
    const discounts = await prisma.discount.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      taxEnabled: billing?.taxEnabled ?? true,
      defaultTaxRate: billing?.defaultTaxRate ?? 0,
      defaultDepositPercent: billing?.defaultDepositPercent ?? 0,

      // ✅ aquí unificamos descuentos dentro del mismo settings
      discountRules: discounts.map((d) => ({
        name: d.name,
        type: d.type,
        value: d.value,
        description: d.description,
        active: d.active,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load invoice settings", details: error.message },
      { status: 500 }
    );
  }
}
