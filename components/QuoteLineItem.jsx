"use client";

import { useEffect, useState } from "react";
import InlineProductEditor from "./InlineProductEditor";

export default function QuoteLineItem({ line, products, onUpdate, onDelete }) {
  const [fullProduct, setFullProduct] = useState(null);

  // Load the FULL product info (with customFields)
  useEffect(() => {
    if (!line.productId) {
      setFullProduct(null);
      return;
    }

    fetch(`/api/products/${line.productId}`)
      .then(res => res.json())
      .then(data => setFullProduct(data))
      .catch(() => setFullProduct(null));
  }, [line.productId]);

  return (
    <div className="border rounded p-3 mb-3 bg-white">
      
      {/* SELECT PRODUCT */}
      <div className="flex gap-3 items-center">
        <select
          className="border p-2 rounded flex-1"
          value={line.productId || ""}
          onChange={e => {
            const productId = Number(e.target.value);

            onUpdate({
              ...line,
              productId,
              qty: null,
              finish: "",
              design: "",
              sides: "",
              total: 0,
              unitPrice: 0,
            });
          }}
        >
          <option value="">Select Product</option>
          {products?.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button className="text-red-600" onClick={onDelete}>
          Delete
        </button>
      </div>

      {/* INLINE PRODUCT CONFIG */}
      {line.productId && (
        <>
          {!fullProduct ? (
            <div className="p-4 text-gray-500">Loading product...</div>
          ) : (
            <InlineProductEditor
              product={fullProduct}
              data={line}
              onChange={patch => onUpdate({ ...line, ...patch })}
            />
          )}
        </>
      )}
    </div>
  );
}
