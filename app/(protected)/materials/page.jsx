"use client";
import { useEffect, useState } from "react";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    fetch("/api/materials")
      .then((r) => r.json())
      .then(setMaterials);
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-xl font-semibold">Materials</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded">
          New Material
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th>Type</th>
            <th>Sell / sqft</th>
            <th>Cost / sqft</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m) => (
            <tr key={m.id} className="border-t">
              <td className="p-2">{m.name}</td>
              <td>{m.unitType}</td>
              <td>${m.sellPerSqft}</td>
              <td>${m.costPerSqft}</td>
              <td>{m.isActive ? "Active" : "Disabled"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
