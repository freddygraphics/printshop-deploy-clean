"use client";

export default function ProductHeader({ product, onChange }) {
  return (
    <div className="bg-white border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">
        Product Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name
          </label>

          <input
            type="text"
            value={product.name}
            onChange={(e) =>
              onChange({
                name: e.target.value,
              })
            }
            className="w-full border rounded-lg px-4 py-3"
            placeholder="Enter product name"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full border rounded-lg px-4 py-3"
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Description */}

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>

        <textarea
          rows={4}
          value={product.description}
          onChange={(e) =>
            onChange({
              description: e.target.value,
            })
          }
          className="w-full border rounded-lg px-4 py-3"
          placeholder="Product description..."
        />
      </div>
    </div>
  );
}
