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
    cf.priceSqft ?? existingData?.priceSqft ?? 0
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
    <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-[#0EA5E9]">Large Format</h2>

      {/* PRODUCT NAME */}
      <div>
        <label className="font-medium text-gray-700">Product Name</label>
        <input
          type="text"
          className="border border-[#E9EDF1] rounded-lg px-3 py-2 w-full mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter product name"
          disabled={mode === "view"}
        />
      </div>

      {/* WIDTH & HEIGHT */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-medium text-gray-700">Width</label>
          <input
            type="number"
            className="border border-[#E9EDF1] rounded-lg px-3 py-2 w-full mt-1"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="0"
            disabled={mode === "view"}
          />
        </div>

        <div>
          <label className="font-medium text-gray-700">Height</label>
          <input
            type="number"
            className="border border-[#E9EDF1] rounded-lg px-3 py-2 w-full mt-1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="0"
            disabled={mode === "view"}
          />
        </div>
      </div>

      {/* PRICE PER SQFT */}
      <div>
        <label className="font-medium text-gray-700">Price per SqFt ($)</label>
        <input
          type="number"
          className="border border-[#E9EDF1] rounded-lg px-3 py-2 w-full mt-1"
          value={priceSqft}
          onChange={(e) => setPriceSqft(e.target.value)}
          disabled={mode === "view"}
        />
      </div>

      {/* UNIT */}
      <div className="flex items-center gap-4 mt-2">
        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="radio"
            name="unit"
            value="inches"
            checked={unit === "inches"}
            onChange={() => setUnit("inches")}
            disabled={mode === "view"}
          />
          Inches
        </label>

        <label className="flex items-center gap-2 text-gray-700">
          <input
            type="radio"
            name="unit"
            value="foot"
            checked={unit === "foot"}
            onChange={() => setUnit("foot")}
            disabled={mode === "view"}
          />
          Feet
        </label>
      </div>

      {/* RESULT BOX */}
      <div className="bg-[#F5F7F9] p-3 rounded-lg border border-[#E9EDF1] mt-4">
        <p className="text-gray-700">
          Area: <span className="font-semibold">{area} SqFt</span>
        </p>

        <p className="text-gray-700">
          Total: <span className="font-bold text-[#0EA5E9]">${total}</span>
        </p>
      </div>

      {/* SAVE BUTTON */}
      {mode !== "view" && (
        <div className="text-right">
          <button
            onClick={handleSave}
            className="bg-[#0EA5E9] text-white px-4 py-2 rounded-md hover:bg-[#0284C7] transition"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}
