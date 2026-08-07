"use client";

import { useRef, useState } from "react";
import StickerCalculator from "@/components/StickerCalculator.jsx";

function createTemporaryId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `sticker-${Date.now()}`;
}

export default function StickerProductConfigurator({
  product,
  onChange,
  initialData = null,
}) {
  const temporaryId = useRef(initialData?.id || createTemporaryId());

  const [value, setValue] = useState({
    qty: Number(initialData?.qty || 1),
    unitPrice: Number(initialData?.unitPrice || 0),
    total: Number(initialData?.total || 0),

    description:
      initialData?.description || initialData?.name || product?.name || "",

    options: {
      ...(product?.defaultOptions || {}),
      ...(initialData?.options || {}),
    },
  });
  function handleChange(result) {
    const nextValue = {
      ...value,
      ...result,

      options: {
        ...(value.options || {}),
        ...(result.options || {}),
      },
    };

    setValue(nextValue);

    const itemName =
      result.description || nextValue.description || product.name;

    onChange?.({
      id: temporaryId.current,

      productId: product.id,
      product,

      name: itemName,
      description: itemName,

      qty: Number(result.qty || nextValue.qty || 1),
      unitPrice: Number(result.unitPrice ?? nextValue.unitPrice ?? 0),
      subtotal: Number(result.total ?? nextValue.total ?? 0),
      total: Number(result.total ?? nextValue.total ?? 0),

      customFields: product.customFields || product.template?.fields || null,

      options: {
        ...(product.defaultOptions || {}),
        ...(initialData?.options || {}),
        ...(result.options || {}),
        productType: "stickers",
      },

      discountType: null,
      discountValue: null,
      discountReason: "",

      _expanded: false,
    });
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7">
      <div className="mb-6 border-b border-gray-200 pb-5">
        <h2 className="text-2xl font-semibold text-gray-900">{product.name}</h2>

        <p className="mt-2 text-sm text-gray-500">
          Configure the sticker size, material and quantity.
        </p>
      </div>

      <StickerCalculator value={value} onChange={handleChange} />
    </div>
  );
}
