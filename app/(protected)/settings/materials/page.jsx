"use client";

import { useEffect, useState } from "react";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    fetch("/api/materials")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load materials");
        }
        return res.json();
      })
      .then(setMaterials)
      .catch((err) => {
        console.error("Materials API error:", err);
        setMaterials([]);
      });
  }, []);

  const updatePrice = async (id, value) => {
    await fetch("/api/materials", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        sellPerSqft: Number(value),
      }),
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Materials – Price per SQFT</h1>

      <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Material</th>
            <th>Price / SQFT</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>
                $
                <input
                  type="number"
                  step="0.01"
                  defaultValue={m.sellPerSqft}
                  style={{ width: 80, marginLeft: 5 }}
                  onBlur={(e) => updatePrice(m.id, e.target.value)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
