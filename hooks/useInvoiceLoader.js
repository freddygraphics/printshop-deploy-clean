"use client";

import { useEffect, useState } from "react";

export function useInvoiceLoader({ mode = "edit", invoiceId = null }) {
  const [loading, setLoading] = useState(mode === "edit" && invoiceId != null);

  const [error, setError] = useState("");
  const [invoiceData, setInvoiceData] = useState(null);
  const [settingsData, setSettingsData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        /*
         * EDIT MODE:
         * cargamos invoice y settings juntos.
         */
        if (mode === "edit" && invoiceId != null) {
          const [invoiceResponse, settingsResponse] = await Promise.all([
            fetch(`/api/invoices/${invoiceId}`, {
              cache: "no-store",
            }),
            fetch("/api/settings/billing", {
              cache: "no-store",
            }),
          ]);

          if (!invoiceResponse.ok) {
            throw new Error("Could not load the invoice.");
          }

          if (!settingsResponse.ok) {
            throw new Error("Could not load billing settings.");
          }

          const [loadedInvoice, loadedSettings] = await Promise.all([
            invoiceResponse.json(),
            settingsResponse.json(),
          ]);

          if (cancelled) return;

          setInvoiceData(loadedInvoice);
          setSettingsData(loadedSettings);

          return;
        }

        /*
         * NEW MODE:
         * solo necesitamos settings.
         */
        const settingsResponse = await fetch("/api/settings/billing", {
          cache: "no-store",
        });

        if (!settingsResponse.ok) {
          throw new Error("Could not load billing settings.");
        }

        const loadedSettings = await settingsResponse.json();

        if (cancelled) return;

        setSettingsData(loadedSettings);
      } catch (loadError) {
        if (cancelled) return;

        console.error("Error loading invoice editor data:", loadError);

        setError(loadError?.message || "Could not load the invoice editor.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [mode, invoiceId]);

  return {
    loading,
    error,
    invoiceData,
    settingsData,
  };
}
