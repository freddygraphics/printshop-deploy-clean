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

    await fetch("/api/sticker-pricing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });

    setTimeout(() => setSaving(null), 800);
  };

  const addType = () => {
    setData([
      ...data,
      {
        name: "Nuevo Tipo",
        costPerSheet: 0,
        laminateCost: 0,
        cutCost: 0,
        wastePercent: 10,
        profitMargin: 40,
      },
    ]);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Sticker Pricing</h1>
            <p className="text-gray-500">
              Configura costos y ganancias por tipo de sticker
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
            key={i}
            className="bg-white rounded-2xl shadow p-6 space-y-4 border"
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
                className="bg-black text-white px-4 py-2 rounded-lg text-sm"
              >
                {saving === item.name ? "Guardando..." : "Guardar"}
              </button>
            </div>

            {/* GRID */}
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
        ))}
      </div>
    </div>
  );
}

/* 🔹 COMPONENTE INPUT PRO */
function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm text-gray-500">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full border p-2 rounded-lg mt-1 focus:ring-2 focus:ring-black"
      />
    </div>
  );
}
