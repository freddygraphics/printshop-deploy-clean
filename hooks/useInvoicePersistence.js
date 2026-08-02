"use client";

import { useRef, useCallback } from "react";

export function useInvoicePersistence({ invoiceId, taxEnabled, taxRate }) {
  const autosaveTimerRef = useRef(null);
  const pdfTimerRef = useRef(null);

  const triggerPdfGeneration = useCallback(() => {
    if (!invoiceId) return;

    if (pdfTimerRef.current) {
      clearTimeout(pdfTimerRef.current);
    }

    pdfTimerRef.current = setTimeout(() => {
      fetch(`/api/invoices/${invoiceId}/generate-pdf`, {
        method: "POST",
      });
    }, 2000);
  }, [invoiceId]);

  const saveItems = useCallback(
    async (itemsToSave) => {
      if (!invoiceId) return;

      if (!Array.isArray(itemsToSave)) return;

      await fetch(`/api/invoices/${invoiceId}/items`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsToSave.map((i) => ({
            productId: i.productId ?? null,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
            total: i.total,
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

      triggerPdfGeneration();
    },
    [invoiceId, triggerPdfGeneration],
  );

  const scheduleAutosave = useCallback(
    (itemsSnapshot) => {
      if (!invoiceId) return;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(() => {
        saveItems(itemsSnapshot);
      }, 900);
    },
    [invoiceId, saveItems],
  );

  const persistTotals = useCallback(
    async ({ subtotal, tax, total, balance }) => {
      if (!invoiceId) return;

      await fetch(`/api/invoices/${invoiceId}`, {
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

      triggerPdfGeneration();
    },
    [invoiceId, taxEnabled, taxRate, triggerPdfGeneration],
  );

  return {
    saveItems,
    scheduleAutosave,
    triggerPdfGeneration,
    persistTotals,
  };
}
