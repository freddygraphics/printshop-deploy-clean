"use client";

import { useEffect, useState } from "react";

const defaultTiers = [
  { minQty: 1, maxQty: 10, unitPrice: 0 },
  { minQty: 11, maxQty: 50, unitPrice: 0 },
  { minQty: 51, maxQty: 100, unitPrice: 0 },
  { minQty: 101, maxQty: 149, unitPrice: 0 },
  { minQty: 150, maxQty: 299, unitPrice: 0 },
  { minQty: 300, maxQty: "", unitPrice: 0 },
];

const emptyVariant = {
  size: "8.5 x 11",
  sides: "Single",
  paperType: "20lb Bond",
  finish: "",
  active: true,
  tiers: defaultTiers,
};

const emptyForm = {
  id: null,
  category: "Standard Copies",
  name: "Black & White",
  active: true,
  variants: [emptyVariant],
};

export default function CounterSalesSettingsClient() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    const res = await fetch("/api/counter-sales/products");
    const data = await res.json();
    setProducts(data);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function resetForm() {
    setForm(JSON.parse(JSON.stringify(emptyForm)));
  }

  function updateProductField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateVariant(index, field, value) {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = {
        ...variants[index],
        [field]: value,
      };

      return {
        ...prev,
        variants,
      };
    });
  }

  function addVariant() {
    setForm((prev) => ({
      ...prev,
      variants: [...prev.variants, JSON.parse(JSON.stringify(emptyVariant))],
    }));
  }

  function removeVariant(index) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  }

  function updateTier(variantIndex, tierIndex, field, value) {
    setForm((prev) => {
      const variants = [...prev.variants];
      const tiers = [...variants[variantIndex].tiers];

      tiers[tierIndex] = {
        ...tiers[tierIndex],
        [field]: value,
      };

      variants[variantIndex] = {
        ...variants[variantIndex],
        tiers,
      };

      return {
        ...prev,
        variants,
      };
    });
  }

  function addTier(variantIndex) {
    setForm((prev) => {
      const variants = [...prev.variants];

      variants[variantIndex] = {
        ...variants[variantIndex],
        tiers: [
          ...variants[variantIndex].tiers,
          { minQty: 1, maxQty: "", unitPrice: 0 },
        ],
      };

      return {
        ...prev,
        variants,
      };
    });
  }

  function removeTier(variantIndex, tierIndex) {
    setForm((prev) => {
      const variants = [...prev.variants];

      variants[variantIndex] = {
        ...variants[variantIndex],
        tiers: variants[variantIndex].tiers.filter((_, i) => i !== tierIndex),
      };

      return {
        ...prev,
        variants,
      };
    });
  }

  function editProduct(product) {
    setForm({
      id: product.id,
      category: product.category,
      name: product.name,
      active: product.active,
      variants: product.variants.map((variant) => ({
        size: variant.size || "",
        sides: variant.sides || "",
        paperType: variant.paperType || "",
        finish: variant.finish || "",
        active: variant.active,
        tiers: variant.tiers.map((tier) => ({
          minQty: tier.minQty,
          maxQty: tier.maxQty ?? "",
          unitPrice: tier.unitPrice,
        })),
      })),
    });
  }

  async function saveProduct(e) {
    e.preventDefault();

    setSaving(true);

    const url = form.id
      ? `/api/counter-sales/products/${form.id}`
      : "/api/counter-sales/products";

    const method = form.id ? "PUT" : "POST";

    await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    await loadProducts();
    resetForm();
    setSaving(false);
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product?")) return;

    await fetch(`/api/counter-sales/products/${id}`, {
      method: "DELETE",
    });

    await loadProducts();
  }

  const grouped = products.reduce((acc, product) => {
    acc[product.category] = acc[product.category] || [];
    acc[product.category].push(product);
    return acc;
  }, {});

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Counter Sales Settings
        </h1>
        <p className="text-gray-500">
          Configura productos, medidas, papel, lados y precios por cantidad.
        </p>
      </div>

      <form
        onSubmit={saveProduct}
        className="bg-white border rounded-xl p-5 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-600">
              Categoría
            </label>
            <input
              value={form.category}
              onChange={(e) => updateProductField("category", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              placeholder="Standard Copies"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Producto
            </label>
            <input
              value={form.name}
              onChange={(e) => updateProductField("name", e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              placeholder="Black & White"
            />
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateProductField("active", e.target.checked)}
              />
              Activo
            </label>
          </div>

          <div className="flex items-end justify-end gap-3">
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-lg font-semibold"
              >
                Cancelar
              </button>
            )}

            <button
              disabled={saving || !form.name}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
            >
              {saving ? "Saving..." : form.id ? "Update" : "Create"}
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-700">
              Medidas / Variantes
            </h2>

            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold"
            >
              + Add Variant
            </button>
          </div>

          {form.variants.map((variant, variantIndex) => (
            <div
              key={variantIndex}
              className="border rounded-xl p-4 bg-gray-50 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-700">
                  Variant #{variantIndex + 1}
                </h3>

                {form.variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(variantIndex)}
                    className="text-red-600 font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500">
                    Medida
                  </label>
                  <input
                    value={variant.size}
                    onChange={(e) =>
                      updateVariant(variantIndex, "size", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    placeholder="8.5 x 11"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">
                    Lados
                  </label>
                  <input
                    value={variant.sides}
                    onChange={(e) =>
                      updateVariant(variantIndex, "sides", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    placeholder="Single / Double"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">
                    Papel
                  </label>
                  <input
                    value={variant.paperType}
                    onChange={(e) =>
                      updateVariant(variantIndex, "paperType", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    placeholder="20lb Bond"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500">
                    Finish
                  </label>
                  <input
                    value={variant.finish}
                    onChange={(e) =>
                      updateVariant(variantIndex, "finish", e.target.value)
                    }
                    className="w-full border rounded-lg px-3 py-2 mt-1"
                    placeholder="5mil / Matte / Gloss"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={variant.active}
                      onChange={(e) =>
                        updateVariant(variantIndex, "active", e.target.checked)
                      }
                    />
                    Activo
                  </label>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-700">Rangos de precio</h4>

                  <button
                    type="button"
                    onClick={() => addTier(variantIndex)}
                    className="text-blue-600 font-bold text-sm"
                  >
                    + Add Tier
                  </button>
                </div>

                <div className="space-y-2">
                  {variant.tiers.map((tier, tierIndex) => (
                    <div key={tierIndex} className="grid grid-cols-4 gap-2">
                      <input
                        type="number"
                        value={tier.minQty}
                        onChange={(e) =>
                          updateTier(
                            variantIndex,
                            tierIndex,
                            "minQty",
                            e.target.value,
                          )
                        }
                        className="border rounded-lg px-3 py-2"
                        placeholder="Min"
                      />

                      <input
                        type="number"
                        value={tier.maxQty}
                        onChange={(e) =>
                          updateTier(
                            variantIndex,
                            tierIndex,
                            "maxQty",
                            e.target.value,
                          )
                        }
                        className="border rounded-lg px-3 py-2"
                        placeholder="Max vacío = +"
                      />

                      <input
                        type="number"
                        step="0.01"
                        value={tier.unitPrice}
                        onChange={(e) =>
                          updateTier(
                            variantIndex,
                            tierIndex,
                            "unitPrice",
                            e.target.value,
                          )
                        }
                        className="border rounded-lg px-3 py-2"
                        placeholder="Price"
                      />

                      <button
                        type="button"
                        onClick={() => removeTier(variantIndex, tierIndex)}
                        className="text-red-600 font-bold"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </form>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="text-lg font-bold text-gray-700 mb-4">
          Lista de precios
        </h2>

        <div className="space-y-8">
          {Object.keys(grouped).map((category) => (
            <div key={category}>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {category}
              </h3>

              <div className="space-y-4">
                {grouped[category].map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-xl overflow-hidden"
                  >
                    <div className="bg-gray-50 p-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-800">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {product.active ? "Activo" : "Inactivo"}
                        </p>
                      </div>

                      <div className="space-x-2">
                        <button
                          onClick={() => editProduct(product)}
                          className="px-3 py-2 rounded-lg border font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="px-3 py-2 rounded-lg border text-red-600 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Medida</th>
                            <th className="text-left p-3">Lados</th>
                            <th className="text-left p-3">Papel</th>
                            <th className="text-left p-3">Finish</th>
                            <th className="text-left p-3">Precios</th>
                          </tr>
                        </thead>

                        <tbody>
                          {product.variants.map((variant) => (
                            <tr key={variant.id} className="border-b">
                              <td className="p-3 font-semibold">
                                {variant.size}
                              </td>
                              <td className="p-3">{variant.sides || "-"}</td>
                              <td className="p-3">
                                {variant.paperType || "-"}
                              </td>
                              <td className="p-3">{variant.finish || "-"}</td>
                              <td className="p-3">
                                <div className="flex flex-wrap gap-2">
                                  {variant.tiers.map((tier) => (
                                    <span
                                      key={tier.id}
                                      className="bg-gray-100 rounded-full px-3 py-1 text-xs"
                                    >
                                      {tier.minQty}-{tier.maxQty ?? "+"}: $
                                      {Number(tier.unitPrice).toFixed(2)}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center text-gray-400 py-10">
              No hay productos configurados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
