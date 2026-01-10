// frontend/components/EditableTable.jsx
"use client";

import { useState, useEffect } from "react";

export default function EditableTable({ initialRows = [], onChange }) {
  const [rows, setRows] = useState(initialRows);
  const [columns, setColumns] = useState(["Quantity", "Price"]);

  // 🔄 Notificar cambios al componente padre
  useEffect(() => {
    if (onChange) onChange(rows);
  }, [rows]);

  // 🧮 Editar celda
  const handleCellChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  // ➕ Agregar fila
  const addRow = () => {
    setRows([...rows, { Quantity: "", Price: "" }]);
  };

  // ➕ Agregar columna
  const addColumn = () => {
    const newColumnName = prompt("Enter column name:");
    if (newColumnName && !columns.includes(newColumnName)) {
      setColumns([...columns, newColumnName]);
      setRows(rows.map((r) => ({ ...r, [newColumnName]: "" })));
    }
  };

  // ❌ Eliminar fila
  const deleteRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-cyan-700">Pricing Table</h3>
        <div className="space-x-2">
          <button
            onClick={addRow}
            className="bg-cyan-700 text-white px-3 py-1 rounded hover:bg-cyan-600"
          >
            ➕ Add Row
          </button>
          <button
            onClick={addColumn}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
          >
            ➕ Add Column
          </button>
        </div>
      </div>

      {/* Tabla */}
      <table className="min-w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold"
              >
                {col}
              </th>
            ))}
            <th className="border border-gray-300 px-4 py-2 text-center">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className="text-center py-3 text-gray-400 italic"
              >
                No rows yet. Click “Add Row” to begin.
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((col) => (
                  <td
                    key={col}
                    className="border border-gray-300 px-3 py-2 text-sm"
                  >
                    <input
                      type="text"
                      value={row[col] || ""}
                      onChange={(e) =>
                        handleCellChange(rowIndex, col, e.target.value)
                      }
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                ))}
                <td className="border border-gray-300 px-4 py-2 text-center">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="text-red-600 hover:text-red-800 font-semibold"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
