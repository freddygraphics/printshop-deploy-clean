import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await prisma.counterSaleProduct.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: {
        variants: {
          orderBy: { id: "asc" },
          include: {
            tiers: {
              orderBy: { minQty: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("COUNTER PRODUCTS GET ERROR:", error);
    return NextResponse.json(
      { error: "Error loading products" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const product = await prisma.counterSaleProduct.create({
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
    console.error("COUNTER PRODUCTS POST ERROR:", error);
    return NextResponse.json(
      { error: "Error creating product" },
      { status: 500 },
    );
  }
}
