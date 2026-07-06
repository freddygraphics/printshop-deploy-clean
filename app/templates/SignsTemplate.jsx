"use client";
import { useState } from "react";

export default function CommercialPrintingTemplate({
  existingData,
  mode,
  onSave,
}) {
  // ============================================================
  // 🔥 CARGAR DATOS EXISTENTES O VALORES POR DEFECTO
  // ============================================================
  const cf = existingData?.customFields || {};

  const [name, setName] = useState(existingData?.name || cf.name || "");
  const [image, setImage] = useState(existingData?.image || "");

  const [rows, setRows] = useState(
    Array.isArray(cf.rows) && cf.rows.length > 0
      ? cf.rows
      : [{ qty: "", price: "" }],
  );

  const [frame, setFrame] = useState(
    Array.isArray(cf.frame) && cf.frame.length > 0
      ? cf.frame
      : [
          { name: "No", price: 0, default: true },
          { name: "Yes", price: 0, default: false },
        ],
  );

  const [shape, setShape] = useState(
    Array.isArray(cf.shape) && cf.shape.length > 0
      ? cf.shape
      : [
          { name: "Square", price: 0, default: true },
          { name: "Round", price: 0, default: false },
        ],
  );

  const [design, setDesign] = useState(
    Array.isArray(cf.design) && cf.design.length > 0
      ? cf.design
      : [
          { name: "No", price: 0, default: true },
          { name: "Yes", price: 0, default: false },
        ],
  );

  const [sides, setSides] = useState(
    Array.isArray(cf.sides) && cf.sides.length > 0
      ? cf.sides
      : [
          { name: "1 Side", price: 0, default: true },
          { name: "2 Sides", price: 0, default: false },
        ],
  );

  // ============================================================
  // 🔥 SINALITE
  // ============================================================

  const [sinaliteEnabled, setSinaliteEnabled] = useState(
    existingData?.sinaliteEnabled || false,
  );

  const [sinaliteId, setSinaliteId] = useState(existingData?.sinaliteId || "");

  const [profitMargin, setProfitMargin] = useState(
    existingData?.profitMargin || 1.5,
  );

  const [sinaliteOptions, setSinaliteOptions] = useState(
    JSON.stringify(existingData?.sinaliteOptions || {}, null, 2),
  );

  // ============================================================
  // 🔧 MANEJO DE FORMULARIO
  // ============================================================
  const addRow = () => {
    setRows([...rows, { qty: "", price: "" }]);
  };

  const handleRowChange = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = value;
    setRows(copy);
  };

  const toggleExclusive = (arr, setArr, index) => {
    const updated = arr.map((item, i) => ({
      ...item,
      default: i === index,
    }));
    setArr(updated);
  };

  // ============================================================
  // 💾 SAVE — ENVÍA PRODUCTO CORRECTO A ProductModal
  // ============================================================
  const handleSave = () => {
    const updated = {
      // 🔥 SINALITE
      image,
      sinaliteEnabled,
      sinaliteId: Number(sinaliteId),
      profitMargin: Number(profitMargin),

      sinaliteOptions: JSON.parse(sinaliteOptions),
      ...existingData,
      image,

      name,
      templateId: 1,

      price: existingData?.price ?? 0,
      basePrice: existingData?.basePrice ?? 0,

      customFields: {
        rows,
        frame,
        shape,
        design,
        sides,
      },

      // ⭐ DefaultOptions seguros para que aparezcan en Quote
      defaultOptions: {
        frame: frame.find((f) => f.default)?.name || frame[0]?.name || "",
        shape: shape.find((s) => s.default)?.name || shape[0]?.name || "",
        design: design.find((d) => d.default)?.name || design[0]?.name || "",
        sides: sides.find((s) => s.default)?.name || sides[0]?.name || "",
      },

      templateType: "signs",
    };

    console.log("🔥 FINAL PRODUCT:", updated);
    onSave(updated);
  };

  // ============================================================
  // UI DEL TEMPLATE
  // ============================================================
  return (
    <div className="space-y-8">
      {/* PRODUCT IMAGE */}

      {/* PRODUCT IMAGE */}

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

        {/* PREVIEW */}

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
      {/* PRODUCT NAME */}
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

      {/* QUANTITY TABLE */}
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
          <div key={i} className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Quantity"
              className="input-kanakku"
              value={row.qty}
              onChange={(e) => handleRowChange(i, "qty", e.target.value)}
            />
            <input
              type="number"
              placeholder="Price ($)"
              className="input-kanakku"
              value={row.price}
              onChange={(e) => handleRowChange(i, "price", e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* OPTIONS */}
      <h3 className="text-gray-700 font-semibold">Options</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* FINISH */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Frame</h3>

          <div className="space-y-2">
            {frame.map((f, i) => (
              <label
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition
        ${f.default ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={f.default}
                    onChange={() => toggleExclusive(frame, setFrame, i)}
                  />
                  <span className="text-sm text-gray-800">{f.name}</span>
                </div>

                <input
                  type="number"
                  className="w-20 rounded-md border px-2 py-1 text-sm text-right"
                  value={f.price}
                  onChange={(e) => {
                    const copy = [...frame];
                    copy[i].price = Number(e.target.value);
                    setFrame(copy);
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* CORNERS */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Shape</h3>

          <div className="space-y-2">
            {shape.map((c, i) => (
              <label
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition
        ${c.default ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={c.default}
                    onChange={() => toggleExclusive(shape, setShape, i)}
                  />
                  <span className="text-sm text-gray-800">{c.name}</span>
                </div>

                <input
                  type="number"
                  className="w-20 rounded-md border px-2 py-1 text-sm text-right"
                  value={c.price}
                  onChange={(e) => {
                    const copy = [...shape];
                    copy[i].price = Number(e.target.value);
                    setShape(copy);
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* DESIGN */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Design</h3>

          <div className="space-y-2">
            {design.map((d, i) => (
              <label
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition
        ${d.default ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={d.default}
                    onChange={() => toggleExclusive(design, setDesign, i)}
                  />
                  <span className="text-sm text-gray-800">{d.name}</span>
                </div>

                <input
                  type="number"
                  className="w-20 rounded-md border px-2 py-1 text-sm text-right"
                  value={d.price}
                  onChange={(e) => {
                    const copy = [...design];
                    copy[i].price = Number(e.target.value);
                    setDesign(copy);
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* SIDES */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Sides</h3>

          <div className="space-y-2">
            {sides.map((s, i) => (
              <label
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition
        ${s.default ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={s.default}
                    onChange={() => toggleExclusive(sides, setSides, i)}
                  />
                  <span className="text-sm text-gray-800">{s.name}</span>
                </div>

                <input
                  type="number"
                  className="w-20 rounded-md border px-2 py-1 text-sm text-right"
                  value={s.price}
                  onChange={(e) => {
                    const copy = [...sides];
                    copy[i].price = Number(e.target.value);
                    setSides(copy);
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      {/* ============================================================ */}
      {/* 🔥 SINALITE */}
      {/* ============================================================ */}

      <div className="border rounded-xl p-5 mt-6 space-y-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">
          Sinalite Integration
        </h3>

        {/* ENABLE */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={sinaliteEnabled}
            onChange={(e) => setSinaliteEnabled(e.target.checked)}
          />

          <span className="text-sm font-medium">Enable Sinalite Pricing</span>
        </label>

        {/* PRODUCT ID */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Sinalite Product ID
          </label>

          <input
            type="number"
            value={sinaliteId}
            onChange={(e) => setSinaliteId(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="101"
          />
        </div>

        {/* PROFIT MARGIN */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Profit Margin
          </label>

          <input
            type="number"
            step="0.1"
            value={profitMargin}
            onChange={(e) => setProfitMargin(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        {/* OPTIONS */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Sinalite Options JSON
          </label>

          <textarea
            rows={10}
            value={sinaliteOptions}
            onChange={(e) => setSinaliteOptions(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full font-mono text-sm"
          />
        </div>
      </div>
      {/* SAVE BUTTON */}
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
