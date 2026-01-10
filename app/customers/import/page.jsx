"use client";

import { useState } from "react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { ArrowLeft } from "lucide-react";

export default function ImportCustomers() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [result, setResult] = useState(null);

  // Leer y mostrar vista previa
  const handlePreview = (e) => {
    const selected = e.target.files[0];
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      setPreview(XLSX.utils.sheet_to_json(sheet));
    };
    reader.readAsBinaryString(selected);
  };

  // Importar clientes
  const handleImport = async () => {
    if (!file) return alert("Selecciona un archivo Excel primero.");

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/clients/import", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setResult(data);
  };

  // Eliminar todos los clientes
  const deleteAllCustomers = async () => {
    if (!confirm("⚠️ ¿Seguro que quieres eliminar TODOS los clientes?")) return;

    const res = await fetch("/api/clients/delete-all", {
      method: "POST",
    });

    const data = await res.json();
    alert(data.message || "Clientes eliminados");

    setPreview([]);
    setResult(null);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto bg-white shadow-lg rounded-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/customers"
          className="flex items-center text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="mr-1" size={18} /> Back to Customers
        </Link>

        <h1 className="text-2xl font-bold">Import Customers (Excel)</h1>

        <button
          onClick={deleteAllCustomers}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          🗑️ Delete ALL Customers
        </button>
      </div>

      {/* File input */}
      <input
        type="file"
        accept=".xlsx"
        onChange={handlePreview}
        className="mb-4"
      />

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <h2 className="font-semibold mt-6">
            Preview ({preview.length} rows)
          </h2>

          <div className="overflow-auto border rounded-lg mt-2 max-h-80">
            <table className="w-full border">
              <thead>
                <tr>
                  {Object.keys(preview[0]).map((col) => (
                    <th key={col} className="border px-2 py-1 bg-gray-100">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="border px-2 py-1">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleImport}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            📥 Import Now
          </button>
        </div>
      )}

      {/* Import results */}
      {result && (
        <div className="mt-6 bg-gray-100 p-4 rounded-lg">
          <p>✔ Imported: {result.imported}</p>
          <p>❗ Errors: {result.errors?.length || 0}</p>
        </div>
      )}
    </div>
  );
}
