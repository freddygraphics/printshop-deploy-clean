import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeOptions(options) {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    return {};
  }

  return options;
}

export async function POST(request, { params }) {
  try {
    const { id } = params;

    // =====================================================
    // LOAD QUOTE REQUEST + REAL PRODUCT
    // =====================================================
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: {
        id,
      },

      include: {
        product: {
          include: {
            template: true,
          },
        },
      },
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { error: "Quote request not found." },
        { status: 404 },
      );
    }

    if (quoteRequest.status === "QUOTED") {
      return NextResponse.json(
        {
          error: "This request has already been converted to a quote.",
        },
        { status: 400 },
      );
    }

    // =====================================================
    // REQUIRE A REAL PRODUCT
    // =====================================================
    const product = quoteRequest.product;

    if (!product) {
      return NextResponse.json(
        {
          error:
            "This quote request is not connected to a product in the catalog.",
        },
        { status: 400 },
      );
    }

    // =====================================================
    // CUSTOMER
    // =====================================================
    let client = await prisma.client.findFirst({
      where: {
        email: quoteRequest.email,
        deletedAt: null,
      },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: quoteRequest.name,
          email: quoteRequest.email,
          phone: quoteRequest.phone || null,
        },
      });
    }

    // =====================================================
    // PRODUCT OPTIONS
    // =====================================================

    // Options defined by the Product's Template
    const templateOptions = normalizeOptions(product.template?.options);

    // Default options defined directly on Product
    const defaultOptions = normalizeOptions(product.defaultOptions);

    // Options selected by customer on website
    const requestedOptions = normalizeOptions(quoteRequest.options);

    // Priority:
    // Template → Product defaults → Customer selections
    const initialOptions = {
      ...templateOptions,
      ...defaultOptions,
      ...requestedOptions,
    };

    // =====================================================
    // QUOTE NUMBER
    // =====================================================
    const counter = await prisma.counter.upsert({
      where: {
        name: "quote",
      },

      update: {
        value: {
          increment: 1,
        },
      },

      create: {
        name: "quote",
        value: 1001,
      },
    });

    const quoteNumber = counter.value;

    // =====================================================
    // CREATE QUOTE
    // =====================================================
    const quote = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.quote.create({
        data: {
          quoteNumber,

          clientId: client.id,

          status: "Pending",

          subtotal: 0,
          tax: 0,
          total: 0,

          customerNotes: quoteRequest.notes || null,

          internalNotes: `Created from website Quote Request ${quoteRequest.id}`,
        },
      });

      // =====================================================
      // CREATE REAL PRODUCT ITEM
      // =====================================================
      await tx.quoteItem.create({
        data: {
          quoteId: newQuote.id,

          // Producto real del sistema
          productId: product.id,
          name: product.name,

          // Cantidad seleccionada en la web
          qty: quoteRequest.qty,

          // El QuoteEditor calculará el precio
          unitPrice: 0,
          total: 0,

          // Selecciones hechas por el cliente
          options: quoteRequest.options || {},

          notes: quoteRequest.notes || null,
        },
      });
      // =====================================================
      // UPDATE REQUEST STATUS
      // =====================================================
      await tx.quoteRequest.update({
        where: {
          id: quoteRequest.id,
        },

        data: {
          status: "QUOTED",
        },
      });

      return newQuote;
    });

    return NextResponse.json({
      success: true,

      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
      },
    });
  } catch (error) {
    console.error("CREATE QUOTE FROM REQUEST ERROR:", error);

    return NextResponse.json(
      {
        error: "Unable to create quote.",
      },
      { status: 500 },
    );
  }
}
