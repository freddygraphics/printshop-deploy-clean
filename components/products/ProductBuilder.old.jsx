"use client";

import { useState } from "react";

function makeId() {
  return crypto.randomUUID();
}

const defaultGroups = [
  {
    id: makeId(),
    name: "Frame",
    type: "radio",
    values: [
      { id: makeId(), name: "No", price: 0, default: true },
      { id: makeId(), name: "Yes", price: 0, default: false },
    ],
  },
  {
    id: makeId(),
    name: "Shape",
    type: "radio",
    values: [
      { id: makeId(), name: "Square", price: 0, default: true },
      { id: makeId(), name: "Round", price: 0, default: false },
    ],
  },
  {
    id: makeId(),
    name: "Design",
    type: "radio",
    values: [
      { id: makeId(), name: "No", price: 0, default: true },
      { id: makeId(), name: "Yes", price: 0, default: false },
    ],
  },
  {
    id: makeId(),
    name: "Sides",
    type: "radio",
    values: [
      { id: makeId(), name: "1 Side", price: 0, default: true },
      { id: makeId(), name: "2 Sides", price: 0, default: false },
    ],
  },
];

export default function ProductBuilder({
  existingData,
  mode,
  onSave,
  templateType = "signs",
}) {
  const cf = existingData?.customFields || {};

  const [name, setName] = useState(existingData?.name || "");
  const [image, setImage] = useState(existingData?.image || "");

  const [rows, setRows] = useState(
    Array.isArray(cf.rows) && cf.rows.length > 0
      ? cf.rows
      : [{ qty: "", price: "" }],
  );

  const [optionGroups, setOptionGroups] = useState(
    Array.isArray(cf.optionGroups) && cf.optionGroups.length > 0
      ? cf.optionGroups
      : defaultGroups,
  );

  const addRow = () => {
    setRows([...rows, { qty: "", price: "" }]);
  };

  const updateRow = (index, field, value) => {
    const copy = [...rows];
    copy[index][field] = value;
    setRows(copy);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const addGroup = () => {
    setOptionGroups([
      ...optionGroups,
      {
        id: makeId(),
        name: "New Option",
        type: "radio",
        values: [{ id: makeId(), name: "Option 1", price: 0, default: true }],
      },
    ]);
  };

  const updateGroup = (groupIndex, field, value) => {
    const copy = [...optionGroups];
    copy[groupIndex][field] = value;
    setOptionGroups(copy);
  };

  const removeGroup = (groupIndex) => {
    setOptionGroups(optionGroups.filter((_, i) => i !== groupIndex));
  };

  const addValue = (groupIndex) => {
    const copy = [...optionGroups];

    copy[groupIndex].values.push({
      id: makeId(),
      name: "New Value",
      price: 0,
      default: false,
    });

    setOptionGroups(copy);
  };

  const updateValue = (groupIndex, valueIndex, field, value) => {
    const copy = [...optionGroups];

    copy[groupIndex].values[valueIndex][field] = value;

    setOptionGroups(copy);
  };

  const removeValue = (groupIndex, valueIndex) => {
    const copy = [...optionGroups];

    copy[groupIndex].values = copy[groupIndex].values.filter(
      (_, i) => i !== valueIndex,
    );

    setOptionGroups(copy);
  };

  const setDefaultValue = (groupIndex, valueIndex) => {
    const copy = [...optionGroups];

    copy[groupIndex].values = copy[groupIndex].values.map((item, i) => ({
      ...item,
      default: i === valueIndex,
    }));

    setOptionGroups(copy);
  };

  const handleSave = () => {
    const defaultOptions = {};

    optionGroups.forEach((group) => {
      const key = group.name.toLowerCase().replace(/\s+/g, "_");
      const defaultValue =
        group.values.find((v) => v.default)?.name ||
        group.values[0]?.name ||
        "";

      defaultOptions[key] = defaultValue;
    });

    const updated = {
      ...existingData,
      name,
      image,
      templateType,
      templateId: existingData?.templateId || 1,
      price: existingData?.price ?? 0,
      basePrice: existingData?.basePrice ?? 0,

      customFields: {
        rows,
        optionGroups,
      },

      defaultOptions,
    };

    console.log("🔥 PRODUCT BUILDER SAVE:", updated);

    onSave(updated);
  };

  return (
    <div className="space-y-8">
      {/* IMAGE */}
      <div className="space-y-4">
        <div>
          <label className="font-medium text-gray-700">Product Image</label>

          <input
            type="file"
            accept="image/*"
            className="border rounded-lg px-3 py-2 w-full mt-1"
            onChange={(e) => {
              const file = e.target.files[0];

              if (!file) return;

              const reader = new FileReader();

              reader.onloadend = () => {
                setImage(reader.result);
              };

              reader.readAsDataURL(file);
            }}
          />
        </div>

        <div className="border rounded-2xl bg-gray-50 p-4 w-fit">
          <div className="w-44 h-44 rounded-xl overflow-hidden border bg-white flex items-center justify-center">
            {image ? (
              <img
                src={image}
                alt="Product"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-sm text-gray-400">No Image</div>
            )}
          </div>
        </div>
      </div>

      {/* NAME */}
      <div>
        <label className="font-medium text-gray-700">Product Name</label>
        <input
          type="text"
          className="border rounded-lg px-3 py-2 w-full mt-1"
          placeholder="Enter product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* QUANTITY */}
      <div className="rounded-xl border bg-gray-50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">
            Quantity & Pricing
          </h3>

          <button
            onClick={addRow}
            className="text-sm text-blue-600 hover:underline"
          >
            + Add Row
          </button>
        </div>

        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-3">
            <input
              type="number"
              placeholder="Quantity"
              className="border rounded-lg px-3 py-2"
              value={row.qty}
              onChange={(e) => updateRow(i, "qty", e.target.value)}
            />

            <input
              type="number"
              placeholder="Price ($)"
              className="border rounded-lg px-3 py-2"
              value={row.price}
              onChange={(e) => updateRow(i, "price", e.target.value)}
            />

            <button
              onClick={() => removeRow(i)}
              className="px-3 rounded-lg border text-red-500 hover:bg-red-50"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      {/* OPTIONS */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-gray-800 font-semibold">Options</h3>

          <button
            onClick={addGroup}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            + Add Option Group
          </button>
        </div>

        {optionGroups.map((group, groupIndex) => (
          <div
            key={group.id}
            className="border rounded-xl p-4 bg-white shadow-sm space-y-4"
          >
            <div className="grid grid-cols-[1fr_160px_auto] gap-3 items-center">
              <input
                type="text"
                className="border rounded-lg px-3 py-2 font-semibold"
                value={group.name}
                onChange={(e) =>
                  updateGroup(groupIndex, "name", e.target.value)
                }
              />

              <select
                className="border rounded-lg px-3 py-2"
                value={group.type}
                onChange={(e) =>
                  updateGroup(groupIndex, "type", e.target.value)
                }
              >
                <option value="radio">Radio</option>
                <option value="dropdown">Dropdown</option>
                <option value="checkbox">Checkbox</option>
              </select>

              <button
                onClick={() => removeGroup(groupIndex)}
                className="px-3 py-2 rounded-lg border text-red-500 hover:bg-red-50"
              >
                🗑
              </button>
            </div>

            <div className="space-y-2">
              {group.values.map((value, valueIndex) => (
                <div
                  key={value.id}
                  className="grid grid-cols-[40px_1fr_120px_auto] gap-3 items-center"
                >
                  <input
                    type="radio"
                    checked={value.default === true}
                    onChange={() => setDefaultValue(groupIndex, valueIndex)}
                  />

                  <input
                    type="text"
                    className="border rounded-lg px-3 py-2"
                    value={value.name}
                    onChange={(e) =>
                      updateValue(
                        groupIndex,
                        valueIndex,
                        "name",
                        e.target.value,
                      )
                    }
                  />

                  <input
                    type="number"
                    className="border rounded-lg px-3 py-2 text-right"
                    value={value.price}
                    onChange={(e) =>
                      updateValue(
                        groupIndex,
                        valueIndex,
                        "price",
                        Number(e.target.value),
                      )
                    }
                  />

                  <button
                    onClick={() => removeValue(groupIndex, valueIndex)}
                    className="px-3 py-2 rounded-lg border text-red-500 hover:bg-red-50"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => addValue(groupIndex)}
              className="text-sm text-blue-600 hover:underline"
            >
              + Add Value
            </button>
          </div>
        ))}
      </div>

      {/* SAVE */}
      <div className="flex justify-end border-t pt-4 mt-6">
        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow"
        >
          Save Product
        </button>
      </div>
    </div>
  );
}
