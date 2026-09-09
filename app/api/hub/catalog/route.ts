import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await prisma.supplierProduct.findMany({
      where: {
        supplierCode: "Hub",
        active: true,
      },

      select: {
        id: true,
        productId: true,
        name: true,
        category: true,
        subCategory: true,
        image: true,
        variantCount: true,
      },

      orderBy: [
        {
          name: "asc",
        },
        {
          productId: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Hub catalog error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to load Hub catalog",
      },
      {
        status: 500,
      },
    );
  }
}
