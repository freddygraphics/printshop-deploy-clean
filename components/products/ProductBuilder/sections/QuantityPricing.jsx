"use client";

import { Plus, Trash2 } from "lucide-react";

export default function QuantityPricing({ rows, onChange }) {
  function update(index, field, value) {
    const copy = [...rows];

    copy[index][field] = value;

    onChange(copy);
  }

  function addRow() {
    onChange([
      ...rows,
      {
        minQty: "",
        maxQty: "",
        unitPrice: "",
      },
    ]);
  }

  function removeRow(index) {
    const copy = rows.filter((_, i) => i !== index);

    onChange(copy);
  }

  return (
    <div className="bg-white border rounded-xl">
      <div className="flex justify-between items-center p-6 border-b">
        <div>
          <h2 className="text-lg font-semibold">Quantity Pricing</h2>

          <p className="text-sm text-gray-500 mt-1">
            Create pricing tiers based on quantity.
          </p>
        </div>

        <button
          onClick={addRow}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} />
          Add Tier
        </button>
      </div>

      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-4">Min Qty</th>

            <th className="text-left p-4">Max Qty</th>

            <th className="text-left p-4">Unit Price</th>

            <th className="w-20"></th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t">
              <td className="p-4">
                <input
                  type="number"
                  value={row.minQty}
                  onChange={(e) => update(index, "minQty", e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </td>

              <td className="p-4">
                <input
                  type="number"
                  value={row.maxQty}
                  onChange={(e) => update(index, "maxQty", e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                  placeholder="∞"
                />
              </td>

              <td className="p-4">
                <input
                  type="number"
                  step="0.01"
                  value={row.unitPrice}
                  onChange={(e) => update(index, "unitPrice", e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </td>

              <td className="text-center">
                <button
                  onClick={() => removeRow(index)}
                  className="text-red-500"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
