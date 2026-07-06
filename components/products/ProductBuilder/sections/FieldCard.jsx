"use client";

import { Plus, Trash2 } from "lucide-react";
import { FIELD_TYPES } from "@/lib/product-builder/field-types";
export default function FieldCard({ field, onChange, onDelete }) {
  function update(name, value) {
    onChange({
      ...field,
      [name]: value,
    });
  }

  function addOption() {
    update("options", [
      ...(field.options || []),
      {
        id: crypto.randomUUID(),
        label: "",
        value: "",
        price: 0,
        priceType: "fixed",
        default: false,
      },
    ]);
  }

  function updateOption(index, key, value) {
    const options = [...(field.options || [])];

    options[index][key] = value;

    update("options", options);
  }

  function removeOption(index) {
    update(
      "options",
      field.options.filter((_, i) => i !== index),
    );
  }

  function setDefault(index) {
    update(
      "options",
      field.options.map((option, i) => ({
        ...option,
        default: i === index,
      })),
    );
  }

  return (
    <div className="border rounded-xl mt-4">
      <div className="p-4 border-b grid grid-cols-5 gap-4">
        <div>
          <label className="text-xs text-gray-500">Label</label>

          <input
            value={field.label || ""}
            onChange={(e) => update("label", e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">Key</label>

          <input
            value={field.key || ""}
            onChange={(e) => update("key", e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500">Type</label>

          <select
            value={field.type}
            onChange={(e) => update("type", e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            {FIELD_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.required || false}
              onChange={(e) => update("required", e.target.checked)}
            />
            Required
          </label>
        </div>
        <div className="flex items-end justify-end">
          <button onClick={onDelete} className="text-red-500">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {FIELD_TYPES.find((t) => t.value === field.type)?.hasOptions && (
        <>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 w-20">Default</th>

                <th className="text-left p-3">Label</th>

                <th className="text-left p-3">Value</th>

                <th className="text-left p-3">Price</th>

                <th className="text-left p-3">Price Type</th>

                <th></th>
              </tr>
            </thead>

            <tbody>
              {(field.options || []).map((option, index) => (
                <tr key={option.id}>
                  <td className="text-center">
                    <input
                      type="radio"
                      checked={option.default}
                      onChange={() => setDefault(index)}
                    />
                  </td>

                  <td className="p-2">
                    <input
                      value={option.label}
                      onChange={(e) =>
                        updateOption(index, "label", e.target.value)
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      value={option.value}
                      onChange={(e) =>
                        updateOption(index, "value", e.target.value)
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>

                  <td className="p-2">
                    <input
                      type="number"
                      value={option.price}
                      onChange={(e) =>
                        updateOption(index, "price", Number(e.target.value))
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>

                  <td className="p-2">
                    <select
                      value={option.priceType}
                      onChange={(e) =>
                        updateOption(index, "priceType", e.target.value)
                      }
                      className="border rounded px-2 py-1 w-full"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percent">Percent</option>
                      <option value="perQty">Per Qty</option>
                      <option value="perSqft">Per SQFT</option>
                    </select>
                  </td>

                  <td>
                    <button
                      onClick={() => removeOption(index)}
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-4 border-t">
            <button
              onClick={addOption}
              className="flex items-center gap-2 text-blue-600"
            >
              <Plus size={18} />
              Add Option
            </button>
          </div>
        </>
      )}
    </div>
  );
}
