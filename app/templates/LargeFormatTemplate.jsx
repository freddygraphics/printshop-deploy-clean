"use client";
import { useState, useEffect } from "react";

export default function LargeFormatTemplate({ existingData, mode, onSave }) {
  // ============================================================
  // 🔥 CARGAR DATOS EXISTENTES O DEFAULTS
  // ============================================================
  const cf = existingData?.customFields || {};

  const [name, setName] = useState(existingData?.name || "");

  const [width, setWidth] = useState(cf.width ?? existingData?.width ?? "");
  const [height, setHeight] = useState(cf.height ?? existingData?.height ?? "");
  const [unit, setUnit] = useState(cf.unit ?? existingData?.unit ?? "inches");
  const [priceSqft, setPriceSqft] = useState(
    cf.priceSqft ?? existingData?.priceSqft ?? 0,
  );

  // ============================================================
  // 🔢 CÁLCULOS
  // ============================================================
  const area =
    unit === "inches"
      ? ((Number(width) * Number(height)) / 144).toFixed(2)
      : (Number(width) * Number(height)).toFixed(2);

  const total = (Number(area) * Number(priceSqft)).toFixed(2);

  // ============================================================
  // 💾 GUARDAR — DEVOLVER PRODUCTO COMPLETO
  // ============================================================
  const handleSave = () => {
    const updated = {
      ...existingData,

      name,
      templateType: "large-format",
      templateId: 2, // ⭐ IMPORTANTE: TEMPLATE 2 PARA LARGE FORMAT

      price: Number(total),
      basePrice: Number(priceSqft),

      // Guardar datos que usará InlineProductEditor
      customFields: {
        width,
        height,
        unit,
        priceSqft,
      },

      // ⭐ Default Options para pre-cargar en Quote
      defaultOptions: {
        width,
        height,
        unit,
        priceSqft,
      },
    };

    console.log("🔥 LargeFormatTemplate → save:", updated);

    onSave(updated);
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="space-y-8">
      <div className="border-b pb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Large Format Printing
        </h2>
        <p className="text-sm text-gray-500">Configure size-based pricing</p>
      </div>

      {/* PRODUCT NAME */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Product Name
        </label>
        <input
          type="text"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Yard Sign 18x24"
          disabled={mode === "view"}
        />
      </div>

      <div className="rounded-xl border bg-gray-50 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Size</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-gray-600">Width</label>
            <input
              type="number"
              className="input-kanakku"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="0"
              disabled={mode === "view"}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-gray-600">Height</label>
            <input
              type="number"
              className="input-kanakku"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="0"
              disabled={mode === "view"}
            />
          </div>
        </div>
      </div>

      {/* PRICE PER SQFT */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Price per SqFt ($)
        </label>
        <input
          type="number"
          className="input-kanakku"
          value={priceSqft}
          onChange={(e) => setPriceSqft(e.target.value)}
          disabled={mode === "view"}
        />
      </div>

      {/* UNIT */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-800">Unit</h3>

        <div className="grid grid-cols-2 gap-3">
          {["inches", "foot"].map((u) => (
            <button
              key={u}
              type="button"
              disabled={mode === "view"}
              onClick={() => setUnit(u)}
              className={`rounded-lg border px-4 py-3 text-sm text-left transition
        ${
          unit === u
            ? "border-blue-500 bg-blue-50 text-blue-700"
            : "hover:border-gray-400 text-gray-700"
        }`}
            >
              {u === "inches" ? "Inches" : "Feet"}
            </button>
          ))}
        </div>
      </div>

      {/* RESULT BOX */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-xs text-gray-500">Area</p>
          <p className="text-lg font-semibold text-gray-900">{area} SqFt</p>
        </div>

        <div className="rounded-lg border bg-blue-50 p-4">
          <p className="text-xs text-blue-600">Total Price</p>
          <p className="text-xl font-bold text-blue-700">${total}</p>
        </div>
      </div>

      {/* SAVE BUTTON */}
      {mode !== "view" && (
        <div className="flex justify-end border-t pt-4 mt-6">
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow"
          >
            Save Product
          </button>
        </div>
      )}
    </div>
  );
}
