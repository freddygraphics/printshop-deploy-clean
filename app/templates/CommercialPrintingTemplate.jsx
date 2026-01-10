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
      : [{ qty: "", price: "" }]
  );

  const [finish, setFinish] = useState(
    Array.isArray(cf.finish) && cf.finish.length > 0
      ? cf.finish
      : [
          { name: "Matte", price: 0, default: true },
          { name: "Gloss", price: 0, default: false },
        ]
  );

  const [corners, setCorners] = useState(
    Array.isArray(cf.corners) && cf.corners.length > 0
      ? cf.corners
      : [
          { name: "Square Corner", price: 0, default: true },
          { name: "Round Corner", price: 0, default: false },
        ]
  );

  const [design, setDesign] = useState(
    Array.isArray(cf.design) && cf.design.length > 0
      ? cf.design
      : [
          { name: "No Design", price: 0, default: true },
          { name: "With Design", price: 0, default: false },
        ]
  );

  const [sides, setSides] = useState(
    Array.isArray(cf.sides) && cf.sides.length > 0
      ? cf.sides
      : [
          { name: "1 Side", price: 0, default: true },
          { name: "2 Sides", price: 0, default: false },
        ]
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
        corners:
          corners.find((c) => c.default)?.name || corners[0]?.name || "",
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
    <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-[#0EA5E9]">
        Commercial Printing
      </h2>

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
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">
          Quantity & Price Table
        </h3>

        <table className="w-full border rounded-md text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Price ($)</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="p-2">
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={row.qty}
                    onChange={(e) =>
                      handleRowChange(i, "qty", e.target.value)
                    }
                  />
                </td>

                <td className="p-2">
                  <input
                    type="number"
                    className="border rounded p-1 w-full"
                    value={row.price}
                    onChange={(e) =>
                      handleRowChange(i, "price", e.target.value)
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className="text-[#0EA5E9] mt-2 text-sm"
          onClick={addRow}
        >
          + Add Row
        </button>
      </div>

      {/* OPTIONS */}
      <h3 className="text-gray-700 font-semibold">Options</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* FINISH */}
        <div>
          <label className="font-medium">Finish</label>
          {finish.map((f, i) => (
            <div key={i} className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={f.default}
                onChange={() => toggleExclusive(finish, setFinish, i)}
              />

              <input
                type="text"
                className="border rounded p-1 w-full"
                value={f.name}
                onChange={(e) => {
                  const copy = [...finish];
                  copy[i].name = e.target.value;
                  setFinish(copy);
                }}
              />

              <input
                type="number"
                className="border rounded p-1 w-20"
                value={f.price}
                onChange={(e) => {
                  const copy = [...finish];
                  copy[i].price = Number(e.target.value);
                  setFinish(copy);
                }}
              />
            </div>
          ))}
        </div>

        {/* CORNERS */}
        <div>
          <label className="font-medium">Corners</label>
          {corners.map((c, i) => (
            <div key={i} className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={c.default}
                onChange={() => toggleExclusive(corners, setCorners, i)}
              />

              <input
                readOnly
                className="border rounded p-1 w-full bg-gray-100"
                value={c.name}
              />

              <input
                type="number"
                className="border rounded p-1 w-20"
                value={c.price}
                onChange={(e) => {
                  const copy = [...corners];
                  copy[i].price = Number(e.target.value);
                  setCorners(copy);
                }}
              />
            </div>
          ))}
        </div>

        {/* DESIGN */}
        <div>
          <label className="font-medium">Design</label>
          {design.map((d, i) => (
            <div key={i} className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={d.default}
                onChange={() => toggleExclusive(design, setDesign, i)}
              />

              <input
                readOnly
                className="border rounded p-1 w-full bg-gray-100"
                value={d.name}
              />

              <input
                type="number"
                className="border rounded p-1 w-20"
                value={d.price}
                onChange={(e) => {
                  const copy = [...design];
                  copy[i].price = Number(e.target.value);
                  setDesign(copy);
                }}
              />
            </div>
          ))}
        </div>

        {/* SIDES */}
        <div>
          <label className="font-medium">Sides</label>
          {sides.map((s, i) => (
            <div key={i} className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={s.default}
                onChange={() => toggleExclusive(sides, setSides, i)}
              />

              <input
                readOnly
                className="border rounded p-1 w-full bg-gray-100"
                value={s.name}
              />

              <input
                type="number"
                className="border rounded p-1 w-20"
                value={s.price}
                onChange={(e) => {
                  const copy = [...sides];
                  copy[i].price = Number(e.target.value);
                  setSides(copy);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="text-right">
        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-md text-white bg-[#0EA5E9] hover:bg-[#0284C7]"
        >
          Save
        </button>
      </div>
    </div>
  );
}
