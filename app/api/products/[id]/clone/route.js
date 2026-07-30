export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 },
      );
    }

    const original = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!original) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const clonedProduct = await prisma.product.create({
      data: {
        name: `${original.name} (Copy)`,

        // No copiar el SKU porque es único en Prisma
        sku: null,

        description: original.description,
        category: original.category,
        pricingMode: original.pricingMode,
        basePrice: original.basePrice,

        defaultOptions: original.defaultOptions,
        customFields: original.customFields,

        templateType: original.templateType,
        templateId: original.templateId,

        profitMargin: original.profitMargin,

        sinaliteEnabled: original.sinaliteEnabled,
        sinaliteId: original.sinaliteId,
        sinaliteOptions: original.sinaliteOptions,

        image: original.image,
      },
    });

    return NextResponse.json(clonedProduct, { status: 201 });
  } catch (error) {
    console.error("ERROR POST /api/products/[id]/clone:", error);

    return NextResponse.json(
      { error: "Could not clone product" },
      { status: 500 },
    );
  }
}
