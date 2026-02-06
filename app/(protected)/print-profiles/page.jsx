"use client";

export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";

export default function PrintProfilesPage() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    fetch("/api/print-profiles")
      .then((r) => r.json())
      .then(setProfiles);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Print Profiles</h1>

      <table className="w-full text-sm border">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th>Mode</th>
            <th>Min $</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.name}</td>
              <td>{p.pricingMode}</td>
              <td>{p.minSubtotal ? `$${p.minSubtotal}` : "—"}</td>
              <td>{p.isActive ? "Active" : "Disabled"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
