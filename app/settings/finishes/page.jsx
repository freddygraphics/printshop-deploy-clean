"use client";

import { useEffect, useState } from "react";

export default function FinishesPage() {
  const [finishes, setFinishes] = useState([]);

  useEffect(() => {
    fetch("/api/finishes")
      .then((res) => res.json())
      .then(setFinishes);
  }, []);

  const updatePrice = async (id, value) => {
    await fetch("/api/finishes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        sellPrice: Number(value),
      }),
    });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Finishes</h1>

      <table border="1" cellPadding="8" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Finish</th>
            <th>Unit</th>
            <th>Price</th>
            <th>How it’s used</th>
          </tr>
        </thead>

        <tbody>
          {finishes.map((f) => (
            <tr key={f.id}>
              <td>{f.name}</td>
              <td>{f.unitType}</td>
              <td>
                $
                <input
                  type="number"
                  step="0.01"
                  defaultValue={f.sellPrice}
                  style={{ width: 80, marginLeft: 5 }}
                  onBlur={(e) => updatePrice(f.id, e.target.value)}
                />
              </td>
              <td>
                {f.unitType === "sqft" && "Multiplied by total SQFT"}
                {f.unitType === "each" && "User enters quantity per job"}
                {f.unitType === "linear_ft" && "Based on job dimensions"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
