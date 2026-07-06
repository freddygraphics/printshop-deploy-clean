import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getUnitPrice(quantity: number, tiers: any[]) {
  const tier = tiers.find((t) => {
    const minOk = quantity >= t.minQty;
    const maxOk = t.maxQty === null || quantity <= t.maxQty;

    return minOk && maxOk;
  });

  return tier ? Number(tier.unitPrice) : 0;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: any = {};

    if (from && to) {
      where.saleDate = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    const sales = await prisma.counterSale.findMany({
      where,
      orderBy: {
        saleDate: "desc",
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    const total = sales.reduce((sum, sale) => sum + Number(sale.total), 0);

    return NextResponse.json({
      sales,
      total,
    });
  } catch (error) {
    console.error("COUNTER SALES GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Error loading sales",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const items = body.items || [];

    if (!items.length) {
      return NextResponse.json(
        {
          error: "No items",
        },
        {
          status: 400,
        },
      );
    }

    const preparedItems: {
      productId: number;
      variantId: number;
      quantity: number;
      unitPrice: number;
      total: number;
    }[] = [];

    let saleTotal = 0;

    for (const item of items) {
      const variant = await prisma.counterSaleVariant.findUnique({
        where: {
          id: Number(item.variantId),
        },
        include: {
          product: true,
          tiers: {
            orderBy: {
              minQty: "asc",
            },
          },
        },
      });

      if (!variant) continue;

      const quantity = Number(item.quantity);

      const unitPrice = getUnitPrice(quantity, variant.tiers);

      const total = quantity * unitPrice;

      saleTotal += total;

      preparedItems.push({
        productId: variant.productId,
        variantId: variant.id,
        quantity,
        unitPrice,
        total,
      });
    }

    const sale = await prisma.counterSale.create({
      data: {
        total: saleTotal,
        saleDate: new Date(),

        items: {
          create: preparedItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("COUNTER SALES POST ERROR:", error);

    return NextResponse.json(
      {
        error: "Error saving sale",
      },
      {
        status: 500,
      },
    );
  }
}
