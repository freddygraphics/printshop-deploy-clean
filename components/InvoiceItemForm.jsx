"use client";

import { useEffect, useState } from "react";

export default function InvoiceItemForm({
  product,
  initialItem = {},
  onChange,
}) {
  const pricingMode = product?.pricingMode || "manual";

  const [qty, setQty] = useState(initialItem.qty || 1);
  const [unitPrice, setUnitPrice] = useState(initialItem.unitPrice || 0);

  // SQFT only
  const [widthIn, setWidthIn] = useState(initialItem.widthIn || "");
  const [heightIn, setHeightIn] = useState(initialItem.heightIn || "");

  // 🔁 Emit changes upward
  useEffect(() => {
    onChange({
      pricingMode,
      qty,
      unitPrice,
      widthIn,
      heightIn,
    });
  }, [pricingMode, qty, unitPrice, widthIn, heightIn]);

  return (
    <div className="space-y-3">
      {/* 🔹 MANUAL */}
      {pricingMode === "manual" && (
        <>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              className="input"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              placeholder="Qty"
            />
            <input
              type="number"
              step="0.01"
              className="input"
              value={unitPrice}
              onChange={(e) => setUnitPrice(Number(e.target.value))}
              placeholder="Unit Price"
            />
          </div>
        </>
      )}

      {/* 🔹 CONFIGURABLE */}
      {pricingMode === "configurable" && (
        <>
          {/* 👇 aquí va TU UI actual */}
          <div className="text-sm text-gray-500">Configurable options…</div>
        </>
      )}

      {/* 🔹 SQFT */}
      {pricingMode === "sqft" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="number"
              step="0.01"
              className="input"
              value={widthIn}
              onChange={(e) => setWidthIn(e.target.value)}
              placeholder="Width (in)"
            />
            <input
              type="number"
              step="0.01"
              className="input"
              value={heightIn}
              onChange={(e) => setHeightIn(e.target.value)}
              placeholder="Height (in)"
            />
            <input
              type="number"
              min={1}
              className="input"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              placeholder="Qty"
            />
          </div>

          <div className="text-xs text-gray-500">
            Price calculated automatically
          </div>
        </>
      )}
    </div>
  );
}
