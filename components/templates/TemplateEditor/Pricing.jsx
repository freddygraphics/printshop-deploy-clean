"use client";

import QuantityPricing from "@/components/products/ProductBuilder/sections/QuantityPricing";
export default function Pricing({ template, onChange }) {
  return (
    <QuantityPricing
      rows={template.quantityPricing || []}
      onChange={(rows) =>
        onChange({
          ...template,
          quantityPricing: rows,
        })
      }
    />
  );
}
