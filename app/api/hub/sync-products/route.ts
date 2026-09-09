import { NextResponse } from "next/server";

import prisma from "@/lib/db";

import { getHubProduct, getHubSellableProducts } from "@/lib/onesource";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function getUniqueProductIds(raw: any) {
  const items = asArray(raw?.ProductSellableArray?.ProductSellable);

  const map = new Map<
    string,
    {
      productId: string;
      variantCount: number;
    }
  >();

  for (const item of items) {
    const productId = String(item?.productId ?? "").trim();

    if (!productId) continue;

    const existing = map.get(productId);

    if (existing) {
      existing.variantCount += 1;
    } else {
      map.set(productId, {
        productId,
        variantCount: 1,
      });
    }
  }

  return Array.from(map.values());
}

async function processInBatches<T>(
  items: T[],
  batchSize: number,
  handler: (item: T) => Promise<void>,
) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    await Promise.all(batch.map((item) => handler(item)));
  }
}

export async function POST() {
  try {
    const rawSellable = await getHubSellableProducts();

    const products = getUniqueProductIds(rawSellable);

    let synced = 0;
    let failed = 0;

    const errors: {
      productId: string;
      error: string;
    }[] = [];

    await processInBatches(products, 5, async (item) => {
      try {
        const rawProduct = await getHubProduct(item.productId);

        const product =
          rawProduct?.Product || rawProduct?.product || rawProduct;

        const name = product?.productName || product?.name || null;

        const description =
          product?.description || product?.productDescription || null;

        const category =
          product?.ProductCategoryArray?.ProductCategory?.category ||
          product?.category ||
          null;

        const subCategory =
          product?.ProductCategoryArray?.ProductCategory?.subCategory ||
          product?.subCategory ||
          null;

        const image =
          product?.primaryImageUrl ||
          product?.image ||
          product?.imageUrl ||
          null;

        const material = product?.material || null;

        const leadTimeRaw = product?.leadTime ?? null;

        const leadTime =
          leadTimeRaw !== null && !Number.isNaN(Number(leadTimeRaw))
            ? Number(leadTimeRaw)
            : null;

        await prisma.supplierProduct.upsert({
          where: {
            supplierCode_productId: {
              supplierCode: "Hub",
              productId: item.productId,
            },
          },

          update: {
            supplier: "HPG / Hub",
            name,
            description,
            category,
            subCategory,
            image,
            material,
            leadTime,
            variantCount: item.variantCount,
            active: true,
            lastSyncedAt: new Date(),
          },

          create: {
            supplier: "HPG / Hub",
            supplierCode: "Hub",
            productId: item.productId,
            name,
            description,
            category,
            subCategory,
            image,
            material,
            leadTime,
            variantCount: item.variantCount,
            active: true,
            lastSyncedAt: new Date(),
          },
        });

        synced += 1;
      } catch (error) {
        failed += 1;

        errors.push({
          productId: item.productId,
          error: error instanceof Error ? error.message : "Unknown error",
        });

        console.error(`Hub sync failed for ${item.productId}`, error);
      }
    });

    return NextResponse.json({
      success: true,
      total: products.length,
      synced,
      failed,
      errors,
    });
  } catch (error) {
    console.error("Hub product sync error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to sync Hub products",
      },
      {
        status: 500,
      },
    );
  }
}
