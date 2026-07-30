"use client";

import { useEffect, useState } from "react";

export default function StickerCalculator({ onChange }) {
  const [pricing, setPricing] = useState([]);
  const [type, setType] = useState("");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2);
  const [qty, setQty] = useState(50);
  const [laminated, setLaminated] = useState(true);
  const [result, setResult] = useState(null);

  // 🔥 SOLO UN useEffect
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/sticker-pricing");
        const data = await res.json();

        if (data.length > 0) {
          setPricing(data);
          const regular = data.find((p) => p.name === "Regular");

          setType(regular ? regular.name : data[0].name);
        } else {
          setPricing([]);
        }
      } catch (err) {
        console.error("Error loading pricing", err);

        const fallback = [{ name: "Regular" }, { name: "Transparente" }];
        setPricing(fallback);
        setType("Regular");
      }
    };

    load();
  }, []);

  useEffect(() => {
    const autoCalculate = async () => {
      if (!type || pricing.length === 0) return;

      const selected = pricing.find((p) => p.name === type);

      if (!selected) return;

      try {
        const res = await fetch("/api/sticker-calc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            stickerWidth: width,
            stickerHeight: height,
            quantity: qty,
            pricing: selected,
            laminated,
          }),
        });

        const data = await res.json();
        setResult(data);
        onChange?.({
          description: `${width}" x ${height}" ${type} Stickers`,

          qty: qty,

          unitPrice: Number((data.finalPrice / qty).toFixed(2)),

          total: Number(data.finalPrice.toFixed(2)),
        });
      } catch (err) {
        console.error("Auto calculate error", err);
      }
    };

    autoCalculate();
  }, [type, width, height, qty, laminated, pricing]);

  return (
    <div className="p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6 space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold">Sticker Calculator</h1>
          <p className="text-gray-500">
            Calcula precio automáticamente por hoja 11 x 17
          </p>
        </div>

        {/* FORM */}
        <div className="grid grid-cols-2 gap-4">
          {/* Tipo */}
          <div>
            <label className="text-sm text-gray-500">Tipo</label>

            <select
              className="w-full border p-2 rounded-lg"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {pricing.map((p, i) => (
                <option key={i} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Ancho */}
          <div>
            <label className="text-sm text-gray-500">Ancho (in)</label>
            <input
              type="number"
              className="w-full border p-2 rounded-lg"
              value={width}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </div>

          {/* Alto */}
          <div>
            <label className="text-sm text-gray-500">Alto (in)</label>
            <input
              type="number"
              className="w-full border p-2 rounded-lg"
              value={height}
              onChange={(e) => setHeight(Number(e.target.value))}
            />
          </div>

          {/* Cantidad */}
          <div>
            <label className="text-sm text-gray-500">Cantidad</label>

            <input
              type="number"
              className="w-full border p-2 rounded-lg"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>

          {/* Laminado */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={laminated}
                onChange={(e) => setLaminated(e.target.checked)}
                className="w-4 h-4"
              />

              <span className="text-sm font-medium">Laminado</span>
            </label>
          </div>
        </div>

        {/* RESULTADOS */}
        {result && (
          <div className="p-6 rounded-2xl">
            <div className="flex justify-between items-start">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">
                    Precio estimado de producción
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <p>Stickers por hoja:</p>
                  <p className="font-medium">{result.stickersPerSheet}</p>

                  <p>Hojas necesarias:</p>
                  <p className="font-medium">{result.sheetsNeeded}</p>

                  {result.discountPercent > 0 && (
                    <>
                      <p>Descuento volumen:</p>

                      <p className="font-medium text-green-600">
                        {result.discountPercent}% OFF
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* PRECIO */}
              <div className="text-right">
                <p className="text-sm text-gray-500">Precio Final</p>

                <div className="text-4xl font-bold">
                  ${Math.round(result.finalPrice || 0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
