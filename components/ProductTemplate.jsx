"use client";

import { useState } from "react";

export default function ProductTemplate({ title }) {
  const [rows, setRows] = useState([{ quantity: "", price: "" }]);
  const [finish, setFinish] = useState([]);
  const [corners, setCorners] = useState([]);
  const [design, setDesign] = useState([]);

  const [newFinish, setNewFinish] = useState("");
  const [newCorner, setNewCorner] = useState("");
  const [newDesign, setNewDesign] = useState("");

  // Tabla dinámica
  const addRow = () => setRows([...rows, { quantity: "", price: "" }]);
  const removeRow = (index) => setRows(rows.filter((_, i) => i !== index));
  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  // Añadir valores manuales
  const addManualValue = (list, setList, value, setValue) => {
    if (value.trim() !== "" && !list.includes(value)) {
      setList([...list, value]);
      setValue("");
    }
  };
  const removeManualValue = (list, setList, value) =>
    setList(list.filter((v) => v !== value));

  return (
    <div className="max-w-3xl mx-auto bg-white shadow-md rounded-2xl p-6 mt-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{title}</h2>

      {/* Nombre del producto */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-600 mb-2">
          Product Name
        </label>
        <input
          type="text"
          placeholder="Enter product name..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#0EA5E9] outline-none"
        />
      </div>

      {/* Tabla dinámica */}
      <div className="mb-8">
        <table className="w-full border border-gray-200 rounded-lg">
          <thead className="bg-[#F5F7F9]">
            <tr>
              <th className="text-left px-4 py-2 text-sm text-gray-600">
                Quantity
              </th>
              <th className="text-left px-4 py-2 text-sm text-gray-600">
                Price
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-t border-gray-200">
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={row.quantity}
                    onChange={(e) => updateRow(index, "quantity", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#0EA5E9] outline-none"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    value={row.price}
                    onChange={(e) => updateRow(index, "price", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#0EA5E9] outline-none"
                  />
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => removeRow(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={addRow}
          className="mt-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 rounded-lg text-sm"
        >
          ➕ Add Row
        </button>
      </div>

      {/* Campos manuales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Finish */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Finish
          </label>
          <div className="flex gap-2 mb-2">
            <input
              value={newFinish}
              onChange={(e) => setNewFinish(e.target.value)}
              placeholder="Add finish..."
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-[#0EA5E9] outline-none"
            />
            <button
              onClick={() => addManualValue(finish, setFinish, newFinish, setNewFinish)}
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-3 py-2 rounded-lg"
            >
              ➕
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {finish.map((item) => (
              <span
                key={item}
                className="bg-[#E0F2FE] text-[#0369A1] px-3 py-1 rounded-full text-xs flex items-center gap-1"
              >
                {item}
                <button onClick={() => removeManualValue(finish, setFinish, item)}>✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* Corners */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Corners
          </label>
          <div className="flex gap-2 mb-2">
            <input
              value={newCorner}
              onChange={(e) => setNewCorner(e.target.value)}
              placeholder="Add corner..."
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-[#0EA5E9] outline-none"
            />
            <button
              onClick={() => addManualValue(corners, setCorners, newCorner, setNewCorner)}
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-3 py-2 rounded-lg"
            >
              ➕
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {corners.map((item) => (
              <span
                key={item}
                className="bg-[#E0F2FE] text-[#0369A1] px-3 py-1 rounded-full text-xs flex items-center gap-1"
              >
                {item}
                <button onClick={() => removeManualValue(corners, setCorners, item)}>✕</button>
              </span>
            ))}
          </div>
        </div>

        {/* Design */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Design
          </label>
          <div className="flex gap-2 mb-2">
            <input
              value={newDesign}
              onChange={(e) => setNewDesign(e.target.value)}
              placeholder="Add design..."
              className="border border-gray-300 rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-[#0EA5E9] outline-none"
            />
            <button
              onClick={() => addManualValue(design, setDesign, newDesign, setNewDesign)}
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-3 py-2 rounded-lg"
            >
              ➕
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {design.map((item) => (
              <span
                key={item}
                className="bg-[#E0F2FE] text-[#0369A1] px-3 py-1 rounded-full text-xs flex items-center gap-1"
              >
                {item}
                <button onClick={() => removeManualValue(design, setDesign, item)}>✕</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-8 bg-[#F5F7F9] p-4 rounded-lg text-sm text-gray-700">
        <p><strong>Finish:</strong> {finish.join(", ") || "None"}</p>
        <p><strong>Corners:</strong> {corners.join(", ") || "None"}</p>
        <p><strong>Design:</strong> {design.join(", ") || "None"}</p>
      </div>
    </div>
  );
}
