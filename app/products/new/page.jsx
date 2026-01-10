"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState(0);

  const [options, setOptions] = useState({
    design: false,
    lamination: false,
    roundCorners: false,
    urgent: false,
  });

  function toggleOption(key) {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function saveProduct() {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        sku,
        description,
        basePrice,
        defaultOptions: options
      }),
    });

    if (res.ok) router.push("/products");
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Crear Producto</h1>

      <label>Nombre</label>
      <input className="border p-2 w-full mb-3"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <label>SKU</label>
      <input className="border p-2 w-full mb-3"
        value={sku}
        onChange={e => setSku(e.target.value)}
      />

      <label>Precio Base</label>
      <input type="number" className="border p-2 w-full mb-3"
        value={basePrice}
        onChange={e => setBasePrice(parseFloat(e.target.value))}
      />

      <label>Descripción</label>
      <textarea className="border p-2 w-full mb-4"
        value={description}
        onChange={e => setDescription(e.target.value)}
      />

      <h2 className="text-lg font-semibold">Opciones por defecto</h2>

      <div className="mt-2 space-y-2">
        {Object.keys(options).map(key => (
          <label key={key} className="flex items-center gap-2">
            <input type="checkbox" checked={options[key]} onChange={() => toggleOption(key)} />
            {key}
          </label>
        ))}
      </div>

      <button
        onClick={saveProduct}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-5"
      >
        Guardar Producto
      </button>
    </div>
  );
}
