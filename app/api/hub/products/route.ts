import { NextResponse } from "next/server";

import { getHubSellableProducts } from "@/lib/onesource";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function GET() {
  try {
    const raw = await getHubSellableProducts();

    const items = asArray(raw?.ProductSellableArray?.ProductSellable);

    const productMap = new Map<
      string,
      {
        productId: string;
        variantCount: number;
        partIds: string[];
      }
    >();

    for (const item of items) {
      const productId = String(item?.productId ?? "").trim();

      const partId = String(item?.partId ?? "").trim();

      if (!productId) {
        continue;
      }

      const existing = productMap.get(productId);

      if (existing) {
        existing.variantCount += 1;

        if (partId) {
          existing.partIds.push(partId);
        }

        continue;
      }

      productMap.set(productId, {
        productId,
        variantCount: 1,
        partIds: partId ? [partId] : [],
      });
    }

    const products = Array.from(productMap.values()).sort((a, b) =>
      a.productId.localeCompare(b.productId, undefined, {
        numeric: true,
      }),
    );

    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Hub sellable products error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Hub products",
      },
      {
        status: 500,
      },
    );
  }
}
