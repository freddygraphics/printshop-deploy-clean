"use client";

import { useEffect, useState } from "react";

type PricingMode = "manual" | "configurable" | "sqft";

interface PreviewInput {
  pricingMode: PricingMode;
  qty: number;
  unitPrice?: number;
  widthIn?: number;
  heightIn?: number;
}

export function usePricingPreview(input: PreviewInput) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 🔒 Guard rails
    if (!input.pricingMode || !input.qty) return;

    if (input.pricingMode === "sqft") {
      if (!input.widthIn || !input.heightIn) return;
    }

    setLoading(true);
    setError(null);

    fetch("/api/pricing/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json();
          throw new Error(err.error || "Preview error");
        }
        return r.json();
      })
      .then((data) => setPreview(data))
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setPreview(null);
      })
      .finally(() => setLoading(false));
  }, [
    input.pricingMode,
    input.qty,
    input.unitPrice,
    input.widthIn,
    input.heightIn,
  ]);

  return {
    preview,
    loading,
    error,
  };
}
