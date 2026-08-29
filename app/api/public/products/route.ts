import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ---------------------------------------------
    // OPTIONAL FILTERS
    // ---------------------------------------------

    const service = searchParams.get("service");
    const category = searchParams.get("category");

    // ---------------------------------------------
    // PRODUCTS
    // ---------------------------------------------

    const products = await prisma.product.findMany({
      where: {
        // Solamente productos habilitados para website
        showOnWebsite: true,

        // -----------------------------------------
        // RELATED SERVICE FILTER
        // Example:
        // ?service=print-newark-nj
        // -----------------------------------------

        ...(service
          ? {
              relatedService: service,
            }
          : {}),

        // -----------------------------------------
        // PRODUCT CATEGORY FILTER
        // Example:
        // ?category=usdot-numbers
        // -----------------------------------------

        ...(category
          ? {
              productCategory: {
                is: {
                  slug: category,
                  active: true,
                },
              },
            }
          : {}),
      },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
        description: true,
        image: true,

        // Legacy Product Type / configurator
        category: true,

        // General service
        relatedService: true,

        // Dynamic Product Category
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

        images: {
          orderBy: {
            position: "asc",
          },

          select: {
            id: true,
            url: true,
            position: true,
            isPrimary: true,
          },
        },
      },
    });

    return NextResponse.json({
      products,
    });
  } catch (error) {
    console.error("PUBLIC PRODUCTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to load products.",
      },
      {
        status: 500,
      },
    );
  }
}
