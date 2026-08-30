"use client";

import ProductDescriptionEditor from "./ProductDescriptionEditor";

export default function ProductHeader({ product, onChange }) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">
        Product Information
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* PRODUCT NAME */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Product Name
          </label>

          <input
            type="text"
            value={product.name || ""}
            onChange={(e) =>
              onChange({
                name: e.target.value,
              })
            }
            className="w-full rounded-lg border px-4 py-3"
            placeholder="Enter product name"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            SKU
          </label>

          <input
            type="text"
            value={product.sku || ""}
            onChange={(e) =>
              onChange({
                sku: e.target.value,
              })
            }
            className="w-full rounded-lg border px-4 py-3"
            placeholder="Optional"
          />
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description
        </label>

        <ProductDescriptionEditor
          value={product.description || ""}
          onChange={(description) =>
            onChange({
              description,
            })
          }
          placeholder="Product description..."
        />
      </div>
    </div>
  );
}
