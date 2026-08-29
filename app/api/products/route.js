export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { id: "asc" },

      select: {
        id: true,
        name: true,

        // IMAGE
        image: true,

        description: true,
        basePrice: true,
        templateType: true,
        pricingMode: true,
        customFields: true,
        defaultOptions: true,

        // EXISTENTE
        category: true,
        relatedService: true,

        // NUEVO
        categoryId: true,

        productCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
            active: true,
            position: true,
          },
        },

        // SINALITE
        sinaliteEnabled: true,
        sinaliteId: true,
        sinaliteOptions: true,
        profitMargin: true,
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
