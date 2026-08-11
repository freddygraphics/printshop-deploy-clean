"use client";

import { useRef, useCallback } from "react";

export function useInvoicePersistence({ invoiceId, taxEnabled, taxRate }) {
  const autosaveTimerRef = useRef(null);

  // ======================================================
  // SAVE ITEMS
  // ======================================================
  const saveItems = useCallback(
    async (itemsToSave) => {
      if (!invoiceId) return null;
      if (!Array.isArray(itemsToSave)) return null;

      const response = await fetch(`/api/invoices/${invoiceId}/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToSave.map((i) => ({
            id: i.id ?? null,

            productId: i.productId ?? null,
            printProductionProfileId: i.printProductionProfileId ?? null,

            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
            total: i.total,

            totalCost: i.totalCost === undefined ? null : i.totalCost,

            pricingMode: i.pricingMode || i.options?.pricingMode || "manual",

            widthIn: i.widthIn ?? i.options?.widthIn ?? null,

            heightIn: i.heightIn ?? i.options?.heightIn ?? null,

            sqft: i.sqft ?? null,
            priceSnapshot: i.priceSnapshot ?? null,
            notes: i.notes ?? null,

            options: {
              ...(i.options || {}),

              finish: i.finish ?? i.options?.finish ?? null,

              design: i.design ?? i.options?.design ?? null,

              sides: i.sides ?? i.options?.sides ?? null,

              corners: i.corners ?? i.options?.corners ?? null,
            },
          })),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.details ||
            data?.error ||
            `Could not save invoice items (${response.status})`,
        );
      }

      return data;
    },
    [invoiceId],
  );

  // ======================================================
  // AUTOSAVE ITEMS
  // ======================================================
  const scheduleAutosave = useCallback(
    (itemsSnapshot, onSuccess) => {
      if (!invoiceId) return;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      const snapshot = itemsSnapshot.map((item) => ({
        ...item,

        options:
          item.options && typeof item.options === "object"
            ? { ...item.options }
            : {},
      }));

      autosaveTimerRef.current = setTimeout(async () => {
        try {
          await saveItems(snapshot);

          if (typeof onSuccess === "function") {
            onSuccess();
          }
        } catch (error) {
          console.error("❌ Invoice items autosave error:", error);
        }
      }, 900);
    },
    [invoiceId, saveItems],
  );

  // ======================================================
  // SAVE TOTALS
  // ======================================================
  const persistTotals = useCallback(
    async ({ subtotal, tax, total, balance }) => {
      if (!invoiceId) return null;

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          subtotal,
          tax,
          total,
          balance,
          taxEnabled,
          taxRate,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.details ||
            data?.error ||
            `Could not save invoice totals (${response.status})`,
        );
      }

      return data;
    },
    [invoiceId, taxEnabled, taxRate],
  );

  return {
    saveItems,
    scheduleAutosave,
    persistTotals,
  };
}
