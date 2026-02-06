import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true, // ✅
        templateType: true,
        pricingMode: true, // 🔥 importante para banners
        customFields: true,
        defaultOptions: true,
      },
    });

    return NextResponse.json(products);
  } catch (err) {
    console.error("🔥 ERROR GET /api/products:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
