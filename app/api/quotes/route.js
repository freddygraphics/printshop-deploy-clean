export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("❌ GET /api/quotes:", error);

    return NextResponse.json(
      {
        error: "Server error",
        details: String(error),
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const lastQuote = await prisma.quote.findFirst({
      where: {
        quoteNumber: {
          not: null,
        },
      },
      orderBy: {
        quoteNumber: "desc",
      },
      select: {
        quoteNumber: true,
      },
    });

    const lastNumber = Number(lastQuote?.quoteNumber || 0);

    const nextQuoteNumber = lastNumber >= 100 ? lastNumber + 1 : 100;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: nextQuoteNumber,

        clientId: Number(body.clientId),

        quoteDate: body.quoteDate ? new Date(body.quoteDate) : new Date(),

        validUntil: body.expiryDate ? new Date(body.expiryDate) : null,

        status: body.status || "Pending",

        customerNotes: body.customerNotes || "",

        subtotal: Number(body.subtotal || 0),

        tax: Number(body.tax || 0),

        total: Number(body.total || 0),

        paymentOption: body.paymentOption || "full",
        items: {
          create: Array.isArray(body.items)
            ? body.items.map((item, index) => {
                const name =
                  String(
                    item.name ||
                      item.description ||
                      item.product?.name ||
                      `Item ${index + 1}`,
                  ).trim() || `Item ${index + 1}`;

                const qtyNumber = Number(item.qty);
                const unitPriceNumber = Number(item.unitPrice);
                const totalNumber = Number(item.total);
                const productIdNumber = Number(item.productId);

                const qty =
                  Number.isFinite(qtyNumber) && qtyNumber > 0
                    ? Math.round(qtyNumber)
                    : 1;

                const unitPrice =
                  Number.isFinite(unitPriceNumber) && unitPriceNumber >= 0
                    ? unitPriceNumber
                    : 0;

                const total =
                  Number.isFinite(totalNumber) && totalNumber >= 0
                    ? totalNumber
                    : qty * unitPrice;

                return {
                  productId:
                    Number.isInteger(productIdNumber) && productIdNumber > 0
                      ? productIdNumber
                      : null,

                  name,

                  qty,
                  unitPrice,
                  total,

                  options:
                    item.options &&
                    typeof item.options === "object" &&
                    !Array.isArray(item.options)
                      ? item.options
                      : {},
                };
              })
            : [],
        },
      },

      include: {
        client: true,
        items: true,
      },
    });

    return NextResponse.json(quote, {
      status: 201,
    });
  } catch (error) {
    console.error("❌ POST /api/quotes:", error);

    return NextResponse.json(
      {
        error: error?.message || "Could not create quote",
      },
      {
        status: 500,
      },
    );
  }
}
