"use client";

import InventorySection from "@/components/products/ProductBuilder/sections/Inventory";

export default function Inventory({ template, onChange }) {
  return (
    <InventorySection
      value={template.inventory || {}}
      onChange={(inventory) =>
        onChange({
          ...template,
          inventory,
        })
      }
    />
  );
}
