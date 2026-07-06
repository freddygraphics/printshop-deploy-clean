"use client";

import { Trash2 } from "lucide-react";

export default function OptionValueCard({
  value,
  index,
  updateValue,
  removeValue,
  setDefault,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="radio"
            checked={Boolean(value.default)}
            onChange={() => setDefault(index)}
            className="h-4 w-4 accent-blue-600"
          />
          Default
        </label>

        <button
          type="button"
          onClick={() => removeValue(index)}
          className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Label
          </label>
          <input
            value={value.label || ""}
            onChange={(e) => updateValue(index, "label", e.target.value)}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
            placeholder="Single Side"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Price
          </label>
          <input
            type="number"
            step="0.01"
            value={value.price ?? 0}
            onChange={(e) =>
              updateValue(index, "price", Number(e.target.value || 0))
            }
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">
            Price Type
          </label>
          <select
            value={value.priceType || "fixed"}
            onChange={(e) => updateValue(index, "priceType", e.target.value)}
            className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
          >
            <option value="fixed">Fixed Price</option>
            <option value="percent">Percentage</option>
            <option value="perQty">Per Quantity</option>
            <option value="perPiece">Per Piece</option>
            <option value="perSqft">Per SQFT</option>
          </select>
        </div>
      </div>
    </div>
  );
}
