export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextResponse } from "next/server";

import prisma from "@/lib/db";
import { priceFromPrintProfileSqft } from "@/lib/pricing/pricingEngine";
import { recalculateInvoiceTotals } from "@/lib/invoices/recalculateInvoiceTotals";

export async function PUT(req, { params }) {
  try {
    const resolvedParams = await params;
    const invoiceId = Number(resolvedParams.id);

    if (!Number.isInteger(invoiceId) || invoiceId <= 0) {
      return NextResponse.json(
        { error: "Invalid invoice id" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const items = Array.isArray(body.items) ? body.items : [];

    const invoiceExists = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!invoiceExists) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoiceExists.status === "VOID") {
      return NextResponse.json(
        { error: "A void invoice cannot be modified" },
        { status: 409 },
      );
    }

    // Guardamos los costos actuales antes de reemplazar los items.
    const existingItems = await prisma.invoiceItem.findMany({
      where: {
        invoiceId,
      },
      select: {
        id: true,
        totalCost: true,
      },
    });

    const existingCosts = new Map(
      existingItems.map((item) => [item.id, item.totalCost]),
    );

    await prisma.$transaction(async (tx) => {
      // Todo se ejecuta dentro de una transacción.
      // Si algún item falla, no se elimina nada definitivamente.
      await tx.invoiceItem.deleteMany({
        where: {
          invoiceId,
        },
      });

      for (const item of items) {
        const qty = Number(item.qty);
        const unitPrice = Number(item.unitPrice);
        const itemTotal = Number(item.total);

        if (!Number.isInteger(qty) || qty <= 0) {
          throw new Error(
            `Invalid quantity for item: ${item.name || "Unnamed item"}`,
          );
        }

        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          throw new Error(
            `Invalid unit price for item: ${item.name || "Unnamed item"}`,
          );
        }

        if (!Number.isFinite(itemTotal) || itemTotal < 0) {
          throw new Error(
            `Invalid total for item: ${item.name || "Unnamed item"}`,
          );
        }

        const previousItemId = Number(item.id);

        let preservedTotalCost = null;

        // Si el frontend envía totalCost, usamos ese valor.
        if (
          item.totalCost !== null &&
          item.totalCost !== undefined &&
          item.totalCost !== ""
        ) {
          const parsedCost = Number(item.totalCost);

          if (!Number.isFinite(parsedCost) || parsedCost < 0) {
            throw new Error(
              `Invalid production cost for item: ${
                item.name || "Unnamed item"
              }`,
            );
          }

          preservedTotalCost = parsedCost;
        } else if (
          Number.isInteger(previousItemId) &&
          existingCosts.has(previousItemId)
        ) {
          // Si no lo envía, conservamos el costo guardado anteriormente.
          preservedTotalCost = existingCosts.get(previousItemId) ?? null;
        }

        const pricingMode =
          item.options?.pricingMode || item.pricingMode || "manual";

        // -----------------------------------------
        // ITEM MANUAL O LEGACY
        // -----------------------------------------
        if (pricingMode !== "sqft") {
          await tx.invoiceItem.create({
            data: {
              invoiceId,
              productId: item.productId ? Number(item.productId) : null,

              printProductionProfileId: item.printProductionProfileId || null,

              name: String(item.name || "").trim() || "Invoice item",

              qty,
              unitPrice,
              total: itemTotal,
              totalCost: preservedTotalCost,
              pricingMode,

              widthIn:
                item.widthIn !== null && item.widthIn !== undefined
                  ? Number(item.widthIn)
                  : null,

              heightIn:
                item.heightIn !== null && item.heightIn !== undefined
                  ? Number(item.heightIn)
                  : null,

              sqft:
                item.sqft !== null && item.sqft !== undefined
                  ? Number(item.sqft)
                  : null,

              priceSnapshot: item.priceSnapshot ?? null,

              options: item.options ?? {},
              notes: item.notes || null,
            },
          });

          continue;
        }

        // -----------------------------------------
        // ITEM CALCULADO POR PIES CUADRADOS
        // -----------------------------------------
        const materialId = item.options?.materialId;

        if (!materialId) {
          throw new Error(
            `Material is required for item: ${item.name || "Unnamed item"}`,
          );
        }

        const material = await tx.material.findUnique({
          where: {
            id: materialId,
          },
          select: {
            id: true,
          },
        });

        if (!material) {
          throw new Error(`Material not found: ${materialId}`);
        }

        const widthIn = Number(item.options?.widthIn ?? item.widthIn);

        const heightIn = Number(item.options?.heightIn ?? item.heightIn);

        if (
          !Number.isFinite(widthIn) ||
          widthIn <= 0 ||
          !Number.isFinite(heightIn) ||
          heightIn <= 0
        ) {
          throw new Error(
            `Invalid dimensions for item: ${item.name || "Unnamed item"}`,
          );
        }

        const breakdown = await priceFromPrintProfileSqft({
          printProductionProfileId: item.printProductionProfileId,
          widthIn,
          heightIn,
          quantity: qty,
        });

        const calculatedTotal = Number(breakdown.subtotal || 0);

        const calculatedUnitPrice = qty > 0 ? calculatedTotal / qty : 0;

        await tx.invoiceItem.create({
          data: {
            invoiceId,

            productId: item.productId ? Number(item.productId) : null,

            printProductionProfileId: item.printProductionProfileId || null,

            name: String(item.name || "").trim() || "Invoice item",

            qty,
            unitPrice: calculatedUnitPrice,
            total: calculatedTotal,
            totalCost: preservedTotalCost,

            pricingMode: "sqft",
            widthIn,
            heightIn,
            sqft: (widthIn * heightIn * qty) / 144,

            priceSnapshot: breakdown,

            options: {
              ...(item.options || {}),
              widthIn,
              heightIn,
              pricingMode: "sqft",
              pricingSnapshot: breakdown,
            },

            notes: item.notes || null,
          },
        });
      }
    });

    // La transacción ya terminó correctamente.
    // Ahora recalculamos subtotal, tax, total y balance.
    const updatedInvoice = await recalculateInvoiceTotals(invoiceId);

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("PUT /api/invoices/[id]/items ERROR:", error);

    return NextResponse.json(
      {
        error: "Failed to save invoice items",
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    );
  }
}
