export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// ======================================================
// GET /api/quotes/[id]
// ======================================================
export async function GET(request, context) {
  try {
    const params = await context.params;
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          error: "Invalid quote id",
        },
        {
          status: 400,
        },
      );
    }

    const quote = await prisma.quote.findUnique({
      where: {
        id,
      },

      include: {
        client: true,

        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        {
          error: "Quote not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("❌ GET /api/quotes/[id]:", error);

    return NextResponse.json(
      {
        error: "Could not load quote",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// PATCH /api/quotes/[id]
// Solo guarda información general y totales.
// Los productos se guardan en /items.
// ======================================================
export async function PATCH(request, context) {
  try {
    const params = await context.params;
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
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

    const clientId = Number(body.clientId ?? body.customerId);

    const data = {};

    if (Number.isInteger(clientId) && clientId > 0) {
      data.clientId = clientId;
    }

    if (body.quoteDate) {
      data.quoteDate = new Date(body.quoteDate);
    }

    if (Object.prototype.hasOwnProperty.call(body, "expiryDate")) {
      data.validUntil = body.expiryDate ? new Date(body.expiryDate) : null;
    }

    if (typeof body.status === "string") {
      data.status = body.status;
    }

    if (typeof body.customerNotes === "string") {
      data.customerNotes = body.customerNotes;
    }

    if (typeof body.paymentOption === "string") {
      data.paymentOption = body.paymentOption;
    }

    if (Number.isFinite(Number(body.subtotal))) {
      data.subtotal = Number(body.subtotal);
    }

    if (Number.isFinite(Number(body.tax))) {
      data.tax = Number(body.tax);
    }

    if (Number.isFinite(Number(body.total))) {
      data.total = Number(body.total);
    }

    const updatedQuote = await prisma.quote.update({
      where: {
        id,
      },

      data,

      include: {
        client: true,

        items: {
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    console.error("❌ PATCH /api/quotes/[id]:", error);

    return NextResponse.json(
      {
        error: "Could not update quote",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}

// ======================================================
// DELETE /api/quotes/[id]
// ======================================================
export async function DELETE(request, context) {
  try {
    const params = await context.params;
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          error: "Invalid quote id",
        },
        {
          status: 400,
        },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.job.deleteMany({
        where: {
          quoteId: id,
        },
      });

      await tx.invoice.deleteMany({
        where: {
          quoteId: id,
        },
      });

      await tx.quoteItem.deleteMany({
        where: {
          quoteId: id,
        },
      });

      await tx.quote.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("❌ DELETE /api/quotes/[id]:", error);

    return NextResponse.json(
      {
        error: "Could not delete quote",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
