"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MaterialForm({ params }) {
  const router = useRouter();
  const [m, setM] = useState({
    name: "",
    category: "banner",
    unitType: "roll",
    rollWidthIn: 54,
    rollLengthFt: 150,
    rollCost: 160,
    wastePercent: 15,
    sellPerSqft: 5.5,
    active: true,
  });

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/materials/${params.id}`)
      .then((r) => r.json())
      .then(setM);
  }, []);

  const save = async () => {
    const url = params.id ? `/api/materials/${params.id}` : "/api/materials";

    await fetch(url, {
      method: params.id ? "PUT" : "POST",
      body: JSON.stringify(m),
    });

    router.push("/materials");
  };

  return (
    <div className="p-6 max-w-3xl space-y-4">
      <h1 className="text-xl font-semibold">
        {params.id ? "Edit Material" : "New Material"}
      </h1>

      <input
        className="input"
        placeholder="Name"
        value={m.name}
        onChange={(e) => setM({ ...m, name: e.target.value })}
      />

      <input
        type="number"
        className="input"
        placeholder="Sell per Sqft"
        value={m.sellPerSqft}
        onChange={(e) => setM({ ...m, sellPerSqft: Number(e.target.value) })}
      />

      <button onClick={save} className="btn-primary">
        Save Material
      </button>
    </div>
  );
}
