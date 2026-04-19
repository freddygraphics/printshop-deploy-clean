"use client";

import { useEffect, useState } from "react";

export default function PrintCalculator({ onAdd }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [options, setOptions] = useState<any>({});
  const [price, setPrice] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  // 🔥 Cargar productos desde DB
  useEffect(() => {
    fetch("/api/print-products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        if (data.length > 0) {
          setSelectedProduct(data[0]);
        }
      });
  }, []);

  // 🔥 Calcular precio
  const calculate = async () => {
    if (!selectedProduct) return;

    // 🔥 VALIDAR OPCIONES
    const requiredFields = [
      "stock",
      "size",
      "coating",
      "variables",
      "perforation",
      "turnaround",
    ];

    for (const field of requiredFields) {
      if (!options[field]) {
        alert(`Falta seleccionar: ${field}`);
        return;
      }
    }

    // 🔥 MAPEO LIMPIO
    const mappedOptions = {
      stock: options.stock,
      size: options.size,
      coating: options.coating,
      numberOfVariables: options.variables, // 🔥 CORREGIDO
      perforation: options.perforation,
      turnaround: options.turnaround,
      quantity: Number(quantity),
    };

    console.log("📦 ENVIANDO A SINALITE:", mappedOptions);

    const res = await fetch("/api/sinalite/price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: selectedProduct.sinaliteId,
        options: mappedOptions,
      }),
    });

    const data = await res.json();
    console.log("💰 RESPUESTA:", data);

    setPrice(data);
  };
  // 🔥 Agregar al invoice
  const addToInvoice = () => {
    onAdd({
      name: `${selectedProduct.name}`,
      quantity: 1,
      unitPrice: price.total * 1.5,
      options,
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl space-y-4 border">
      <h2 className="text-xl font-semibold">Print Calculator PRO</h2>

      {/* 🔥 PRODUCTOS DINÁMICOS */}
      <select
        onChange={(e) => {
          const selected = products.find((p) => p.id === e.target.value);
          setSelectedProduct(selected);
          setOptions({});
          setPrice(null);
        }}
      >
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* 🔥 OPCIONES DINÁMICAS */}
      {selectedProduct &&
        Object.entries(selectedProduct.options).map(([key, values]: any) => (
          <div key={key}>
            <label className="block text-sm font-medium">{key}</label>

            <select
              onChange={(e) =>
                setOptions({
                  ...options,
                  [key]: e.target.value,
                })
              }
            >
              {values.map((v: any) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        ))}

      <button onClick={calculate} className="bg-black text-white px-4 py-2">
        Calcular precio
      </button>
      <div>
        <label className="block text-sm font-medium">Quantity</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="border px-2 py-1 w-full"
        />
      </div>
      {price && (
        <div>
          <p>Costo: ${price.total}</p>
          <p>Venta: ${price.total * 1.5}</p>

          <button
            onClick={addToInvoice}
            className="bg-green-600 text-white px-4 py-2 mt-2"
          >
            Agregar al invoice
          </button>
        </div>
      )}
    </div>
  );
}
