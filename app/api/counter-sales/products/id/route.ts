import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const productId = Number(id);
    const body = await req.json();

    await prisma.counterSaleVariant.deleteMany({
      where: { productId },
    });

    const product = await prisma.counterSaleProduct.update({
      where: { id: productId },
      data: {
        category: body.category,
        name: body.name,
        active: body.active ?? true,
        variants: {
          create: body.variants.map((variant: any) => ({
            size: variant.size,
            sides: variant.sides || null,
            paperType: variant.paperType || null,
            finish: variant.finish || null,
            active: variant.active ?? true,
            tiers: {
              create: variant.tiers.map((tier: any) => ({
                minQty: Number(tier.minQty),
                maxQty:
                  tier.maxQty === "" || tier.maxQty === null
                    ? null
                    : Number(tier.maxQty),
                unitPrice: Number(tier.unitPrice),
              })),
            },
          })),
        },
      },
      include: {
        variants: {
          include: { tiers: true },
        },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("COUNTER PRODUCT PUT ERROR:", error);
    return NextResponse.json(
      { error: "Error updating product" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    await prisma.counterSaleProduct.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("COUNTER PRODUCT DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Error deleting product" },
      { status: 500 },
    );
  }
}
