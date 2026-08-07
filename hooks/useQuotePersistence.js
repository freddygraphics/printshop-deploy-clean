"use client";

import { useCallback, useEffect, useRef } from "react";

export function useQuotePersistence({ quoteId }) {
  const autosaveTimerRef = useRef(null);
  const savingPromiseRef = useRef(Promise.resolve());

  const saveItems = useCallback(
    async (itemsToSave) => {
      if (!quoteId) return null;
      if (!Array.isArray(itemsToSave)) return null;

      const payload = {
        items: itemsToSave.map((item, index) => {
          const description =
            String(
              item.description ||
                item.name ||
                item.product?.name ||
                `Item ${index + 1}`,
            ).trim() || `Item ${index + 1}`;

          return {
            productId: item.productId ?? null,

            description,

            qty: Number(item.qty) || 1,
            unitPrice: Number(item.unitPrice) || 0,
            total: Number(item.total) || 0,

            options: {
              ...(item.options || {}),

              finish: item.finish ?? item.options?.finish ?? null,

              design: item.design ?? item.options?.design ?? null,

              sides: item.sides ?? item.options?.sides ?? null,

              corners: item.corners ?? item.options?.corners ?? null,
            },
          };
        }),
      };

      /*
       * Encadena guardados para evitar que dos requests
       * borren y creen productos al mismo tiempo.
       */
      savingPromiseRef.current = savingPromiseRef.current.then(async () => {
        const response = await fetch(`/api/quotes/${quoteId}/items`, {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        let data = null;

        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          data = null;
        }

        if (!response.ok) {
          throw new Error(
            data?.details ||
              data?.error ||
              `Could not save quote items (${response.status})`,
          );
        }

        return data;
      });

      return savingPromiseRef.current;
    },
    [quoteId],
  );

  const scheduleAutosave = useCallback(
    (itemsSnapshot, onSuccess) => {
      if (!quoteId) return;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      /*
       * Creamos una copia para que el timer no use
       * una referencia que React pueda modificar después.
       */
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
          console.error("❌ Quote items autosave error:", error);
        }
      }, 900);
    },
    [quoteId, saveItems],
  );

  const persistQuote = useCallback(
    async ({
      clientId,
      quoteDate,
      expiryDate,
      status,
      customerNotes,
      subtotal,
      tax,
      total,
      paymentOption,
    }) => {
      if (!quoteId) return null;

      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          clientId,
          quoteDate,
          expiryDate,
          status,
          customerNotes,
          subtotal,
          tax,
          total,
          paymentOption,
        }),
      });

      const responseText = await response.text();

      let data = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.details ||
            data?.error ||
            `Could not save quote (${response.status})`,
        );
      }

      return data;
    },
    [quoteId],
  );

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  return {
    saveItems,
    scheduleAutosave,
    persistQuote,
  };
}
