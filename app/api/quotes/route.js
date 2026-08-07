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

    // ---------------------------------------------
    // CLIENTE OPCIONAL
    // ---------------------------------------------
    const parsedClientId = Number(body.clientId);

    const clientId =
      Number.isInteger(parsedClientId) && parsedClientId > 0
        ? parsedClientId
        : null;

    // Si enviaron un cliente, confirmamos que exista.
    if (clientId) {
      const clientExists = await prisma.client.findUnique({
        where: {
          id: clientId,
        },
        select: {
          id: true,
        },
      });

      if (!clientExists) {
        return NextResponse.json(
          {
            error: "Customer not found",
          },
          {
            status: 400,
          },
        );
      }
    }

    // ---------------------------------------------
    // SIGUIENTE NÚMERO DE QUOTE
    // ---------------------------------------------
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

    // ---------------------------------------------
    // NORMALIZAR ITEMS
    // ---------------------------------------------
    const normalizedItems = Array.isArray(body.items)
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
      : [];

    // ---------------------------------------------
    // CALCULAR TOTALES SI NO VIENEN
    // ---------------------------------------------
    const calculatedSubtotal = normalizedItems.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0,
    );

    const subtotal = Number.isFinite(Number(body.subtotal))
      ? Number(body.subtotal)
      : calculatedSubtotal;

    const tax = Number.isFinite(Number(body.tax)) ? Number(body.tax) : 0;

    const total = Number.isFinite(Number(body.total))
      ? Number(body.total)
      : subtotal + tax;

    // Sin cliente se crea como Draft.
    const status = body.status || (clientId ? "Pending" : "Draft");

    // ---------------------------------------------
    // CREAR QUOTE
    // ---------------------------------------------
    const quote = await prisma.quote.create({
      data: {
        quoteNumber: nextQuoteNumber,

        // Ahora puede ser null
        clientId,

        quoteDate: body.quoteDate ? new Date(body.quoteDate) : new Date(),

        validUntil: body.expiryDate ? new Date(body.expiryDate) : null,

        status,

        customerNotes: body.customerNotes || "",

        subtotal,
        tax,
        total,

        paymentOption: body.paymentOption || "full",

        items: {
          create: normalizedItems,
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
        error:
          error instanceof Error ? error.message : "Could not create quote",
      },
      {
        status: 500,
      },
    );
  }
}
