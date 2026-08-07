export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// ======================================================
// PUT /api/quotes/[id]/items
// ======================================================
export async function PUT(request, context) {
  try {
    const params = await context.params;
    const quoteId = Number(params.id);

    if (!Number.isInteger(quoteId) || quoteId <= 0) {
      return NextResponse.json(
        {
          error: "Invalid quote id",
        },
        {
          status: 400,
        },
      );
    }

    const body = await request.json();

    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        {
          error: "Items must be an array",
        },
        {
          status: 400,
        },
      );
    }

    const quoteExists = await prisma.quote.findUnique({
      where: {
        id: quoteId,
      },

      select: {
        id: true,
      },
    });

    if (!quoteExists) {
      return NextResponse.json(
        {
          error: "Quote not found",
        },
        {
          status: 404,
        },
      );
    }

    const normalizedItems = body.items.map((item, index) => {
      const name =
        String(
          item.name ||
            item.description ||
            item.product?.name ||
            `Item ${index + 1}`,
        ).trim() || `Item ${index + 1}`;

      const options =
        item.options &&
        typeof item.options === "object" &&
        !Array.isArray(item.options)
          ? item.options
          : {};

      const productType = String(
        options.productType ||
          item.product?.productType ||
          item.productType ||
          "",
      )
        .trim()
        .toLowerCase();

      const isApparel = productType === "apparel";

      const qtyNumber = Number(item.qty);
      const unitPriceNumber = Number(item.unitPrice);
      const totalNumber = Number(item.total);
      const productIdNumber = Number(item.productId);

      const qty =
        Number.isFinite(qtyNumber) && qtyNumber > 0 ? Math.round(qtyNumber) : 1;

      const unitPrice =
        Number.isFinite(unitPriceNumber) && unitPriceNumber >= 0
          ? unitPriceNumber
          : 0;

      const total =
        Number.isFinite(totalNumber) && totalNumber >= 0
          ? totalNumber
          : qty * unitPrice;

      return {
        quoteId,

        // SanMar/Apparel no pertenece a la tabla Product.
        productId:
          !isApparel && Number.isInteger(productIdNumber) && productIdNumber > 0
            ? productIdNumber
            : null,

        name,
        qty,
        unitPrice,
        total,

        options: {
          ...options,

          ...(isApparel
            ? {
                productType: "apparel",

                apparelProductId:
                  options.apparelProductId || item.product?.id || null,
              }
            : {}),
        },

        notes:
          typeof item.notes === "string" && item.notes.trim()
            ? item.notes.trim()
            : null,
      };
    });

    /*
     * Transaction profesional:
     * si falla la creación, no se pierden
     * los productos anteriores.
     */
    const savedItems = await prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({
        where: {
          quoteId,
        },
      });

      if (normalizedItems.length > 0) {
        console.log("NORMALIZED ITEMS");
        console.dir(normalizedItems, { depth: null });

        await tx.quoteItem.createMany({
          data: normalizedItems,
        });
      }

      return tx.quoteItem.findMany({
        where: {
          quoteId,
        },
        orderBy: {
          id: "asc",
        },
      });
    });

    return NextResponse.json({
      ok: true,
      items: savedItems,
    });
  } catch (error) {
    console.error("❌ PUT /api/quotes/[id]/items:", error);

    return NextResponse.json(
      {
        error: "Failed to save quote items",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
