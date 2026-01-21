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

  const [rows, setRows] = useState(
    Array.isArray(cf.rows) && cf.rows.length > 0
      ? cf.rows
      : [{ qty: "", price: "" }],
  );

  const [finish, setFinish] = useState(
    Array.isArray(cf.finish) && cf.finish.length > 0
      ? cf.finish
      : [
          { name: "Matte", price: 0, default: true },
          { name: "Gloss", price: 0, default: false },
        ],
  );

  const [corners, setCorners] = useState(
    Array.isArray(cf.corners) && cf.corners.length > 0
      ? cf.corners
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
      ...existingData,

      name,
      templateId: 1,

      price: existingData?.price ?? 0,
      basePrice: existingData?.basePrice ?? 0,

      customFields: {
        rows,
        finish,
        corners,
        design,
        sides,
      },

      // ⭐ DefaultOptions seguros para que aparezcan en Quote
      defaultOptions: {
        finish: finish.find((f) => f.default)?.name || finish[0]?.name || "",
        corners: corners.find((c) => c.default)?.name || corners[0]?.name || "",
        design: design.find((d) => d.default)?.name || design[0]?.name || "",
        sides: sides.find((s) => s.default)?.name || sides[0]?.name || "",
      },

      templateType: "commercial-printing",
    };

    console.log("🔥 FINAL PRODUCT:", updated);
    onSave(updated);
  };

  // ============================================================
  // UI DEL TEMPLATE
  // ============================================================
  return (
    <div className="space-y-8">
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
          <h3 className="text-sm font-semibold text-gray-800">Finish</h3>

          <div className="space-y-2">
            {finish.map((f, i) => (
              <label
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition
        ${f.default ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={f.default}
                    onChange={() => toggleExclusive(finish, setFinish, i)}
                  />
                  <span className="text-sm text-gray-800">{f.name}</span>
                </div>

                <input
                  type="number"
                  className="w-20 rounded-md border px-2 py-1 text-sm text-right"
                  value={f.price}
                  onChange={(e) => {
                    const copy = [...finish];
                    copy[i].price = Number(e.target.value);
                    setFinish(copy);
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        {/* CORNERS */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Corners</h3>

          <div className="space-y-2">
            {corners.map((c, i) => (
              <label
                key={i}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition
        ${c.default ? "border-blue-500 bg-blue-50" : "hover:border-gray-400"}`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={c.default}
                    onChange={() => toggleExclusive(corners, setCorners, i)}
                  />
                  <span className="text-sm text-gray-800">{c.name}</span>
                </div>

                <input
                  type="number"
                  className="w-20 rounded-md border px-2 py-1 text-sm text-right"
                  value={c.price}
                  onChange={(e) => {
                    const copy = [...corners];
                    copy[i].price = Number(e.target.value);
                    setCorners(copy);
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
