"use client";

import { useEffect, useState } from "react";

export default function StickerSettings() {
  const [data, setData] = useState([]);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    fetch("/api/sticker-pricing")
      .then((res) => res.json())
      .then(setData);
  }, []);

  const updateField = (index, field, value) => {
    const updated = [...data];
    updated[index][field] = value;
    setData(updated);
  };

  const save = async (item) => {
    setSaving(item.name);

    try {
      const res = await fetch("/api/sticker-pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      const savedItem = await res.json();

      if (!res.ok) {
        throw new Error(savedItem?.error || "Error saving pricing");
      }

      // Importante para tipos nuevos:
      // después de crear, guardamos el id recibido desde Prisma.
      setData((current) =>
        current.map((row) =>
          row === item
            ? {
                ...row,
                ...savedItem,
              }
            : row,
        ),
      );
    } catch (err) {
      console.error("Error saving sticker pricing:", err);
    } finally {
      setTimeout(() => setSaving(null), 800);
    }
  };

  const addType = () => {
    setData([
      ...data,
      {
        name: "Nuevo Tipo",

        // MEDIDA DE LA HOJA
        sheetWidth: 11,
        sheetHeight: 17,

        // COSTOS
        costPerSheet: 0,
        laminateCost: 0,
        cutCost: 0,

        // PRICING
        wastePercent: 10,
        profitMargin: 40,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Sticker Pricing</h1>

            <p className="text-gray-500 mt-1">
              Configura costos, medidas de hoja y ganancias por tipo de sticker
            </p>
          </div>

          <button
            onClick={addType}
            className="bg-black text-white px-4 py-2 rounded-lg"
          >
            + Nuevo Tipo
          </button>
        </div>

        {/* CARDS */}
        {data.map((item, i) => (
          <div
            key={item.id || i}
            className="bg-white rounded-2xl shadow p-6 space-y-5 border"
          >
            {/* TITLE */}
            <div className="flex justify-between items-center">
              <input
                value={item.name}
                onChange={(e) => updateField(i, "name", e.target.value)}
                className="text-lg font-bold border-b outline-none"
              />

              <button
                onClick={() => save(item)}
                disabled={saving === item.name}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
              >
                {saving === item.name ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {/* MEDIDA DE HOJA */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Medida de la hoja
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ancho hoja (in)"
                  value={item.sheetWidth ?? 11}
                  onChange={(v) => updateField(i, "sheetWidth", v)}
                />

                <Input
                  label="Alto hoja (in)"
                  value={item.sheetHeight ?? 17}
                  onChange={(v) => updateField(i, "sheetHeight", v)}
                />
              </div>
            </div>

            {/* COSTOS */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Costos</p>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Costo hoja"
                  value={item.costPerSheet}
                  onChange={(v) => updateField(i, "costPerSheet", v)}
                />

                <Input
                  label="Laminado"
                  value={item.laminateCost}
                  onChange={(v) => updateField(i, "laminateCost", v)}
                />

                <Input
                  label="Corte"
                  value={item.cutCost}
                  onChange={(v) => updateField(i, "cutCost", v)}
                />
              </div>
            </div>

            {/* PRICING */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Pricing
              </p>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Desperdicio %"
                  value={item.wastePercent}
                  onChange={(v) => updateField(i, "wastePercent", v)}
                />

                <Input
                  label="Ganancia %"
                  value={item.profitMargin}
                  onChange={(v) => updateField(i, "profitMargin", v)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* COMPONENTE INPUT */
function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-500">{label}</label>

      <input
        type="number"
        step="0.01"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-black outline-none"
      />
    </div>
  );
}
