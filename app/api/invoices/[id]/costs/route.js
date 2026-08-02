import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// --------------------------------------------------
// PATCH — Guardar costos de los items de un invoice
// --------------------------------------------------
export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    const invoiceId = Number(resolvedParams.id);
    const body = await req.json();

    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.items)) {
      return NextResponse.json(
        { error: "The items field must be an array" },
        { status: 400 },
      );
    }

    const updatedItems = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: {
          id: invoiceId,
        },
        include: {
          invoiceItems: true,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.status === "VOID") {
        throw new Error("Costs cannot be modified for a void invoice");
      }

      const validItemIds = new Set(invoice.invoiceItems.map((item) => item.id));

      const results = [];

      for (const item of body.items) {
        const itemId = Number(item.id);

        if (!Number.isInteger(itemId) || !validItemIds.has(itemId)) {
          throw new Error(`Invalid invoice item: ${item.id}`);
        }

        let totalCost = null;

        if (
          item.totalCost !== null &&
          item.totalCost !== undefined &&
          item.totalCost !== ""
        ) {
          totalCost = Number(item.totalCost);

          if (!Number.isFinite(totalCost) || totalCost < 0) {
            throw new Error(`Invalid cost for invoice item ${itemId}`);
          }
        }

        const updatedItem = await tx.invoiceItem.update({
          where: {
            id: itemId,
          },
          data: {
            totalCost,
          },
        });

        results.push(updatedItem);
      }

      return results;
    });

    const updatedInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        client: true,
        invoiceItems: {
          include: {
            product: true,
          },
          orderBy: {
            id: "asc",
          },
        },
      },
    });

    if (!updatedInvoice) {
      return NextResponse.json(
        { error: "Invoice not found after update" },
        { status: 404 },
      );
    }

    const items = updatedInvoice.invoiceItems || [];

    const costsCompleted =
      items.length > 0 && items.every((item) => item.totalCost !== null);

    const totalCost = items.reduce(
      (sum, item) => sum + Number(item.totalCost ?? 0),
      0,
    );

    // El subtotal no incluye impuestos
    const salesAmount = Number(updatedInvoice.subtotal || 0);

    const profit = costsCompleted ? salesAmount - totalCost : null;

    const profitMargin =
      costsCompleted && salesAmount > 0 ? (profit / salesAmount) * 100 : null;

    return NextResponse.json({
      success: true,
      updatedItems,
      invoice: updatedInvoice,
      profitability: {
        costsCompleted,
        totalCost,
        salesAmount,
        profit,
        profitMargin,
      },
    });
  } catch (error) {
    console.error("PATCH /api/invoices/[id]/costs ERROR:", error);

    const message = error instanceof Error ? error.message : String(error);

    const status =
      message === "Invoice not found"
        ? 404
        : message.includes("void invoice")
          ? 409
          : message.includes("Invalid")
            ? 400
            : 500;

    return NextResponse.json(
      {
        error: status === 500 ? "Server error" : message,
        details: message,
      },
      {
        status,
      },
    );
  }
}
