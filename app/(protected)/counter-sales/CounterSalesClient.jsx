"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function CounterSalesClient() {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);

  async function loadProducts() {
    const res = await fetch("/api/counter-sales/products");
    const data = await res.json();
    setProducts(data.filter((p) => p.active));
  }

  async function loadSales() {
    const res = await fetch("/api/counter-sales");
    const data = await res.json();
    setSales(data.sales || []);
  }

  useEffect(() => {
    loadProducts();
    loadSales();
  }, []);

  const selectedProduct = products.find(
    (p) => String(p.id) === String(productId),
  );

  const variants = selectedProduct?.variants?.filter((v) => v.active) || [];

  const selectedVariant = variants.find(
    (v) => String(v.id) === String(variantId),
  );

  const unitPrice = useMemo(() => {
    if (!selectedVariant) return 0;

    const qty = Number(quantity || 0);

    const tier = selectedVariant.tiers.find((t) => {
      const minOk = qty >= t.minQty;
      const maxOk = t.maxQty === null || qty <= t.maxQty;
      return minOk && maxOk;
    });

    return tier ? Number(tier.unitPrice) : 0;
  }, [selectedVariant, quantity]);

  const total = Number(quantity || 0) * unitPrice;

  function handleProductChange(value) {
    setProductId(value);
    setVariantId("");
  }

  function addItem() {
    if (!selectedVariant) return;

    const itemTotal = unitPrice * Number(quantity);

    setCart((prev) => [
      ...prev,
      {
        variantId: selectedVariant.id,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        size: selectedVariant.size,
        quantity: Number(quantity),
        unitPrice,
        total: itemTotal,
      },
    ]);

    setQuantity(1);
  }

  async function completeSale() {
    if (cart.length === 0) return;

    setLoading(true);

    await fetch("/api/counter-sales", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: cart,
      }),
    });

    setCart([]);

    await loadSales();

    setLoading(false);
  }

  const shownTotal = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.total), 0);
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Counter Sales</h1>
          <p className="text-gray-500">Ventas rápidas sin crear invoice.</p>
        </div>

        <Link
          href="/counter-sales/settings"
          className="px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold"
        >
          Settings
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={(e) => e.preventDefault()}
          className="lg:col-span-1 bg-white border rounded-xl p-5 space-y-4"
        >
          <h2 className="text-lg font-bold text-gray-700">Nueva venta</h2>

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Producto
            </label>
            <select
              value={productId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            >
              <option value="">Seleccionar producto</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.category} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Medida / Opciones
            </label>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              disabled={!productId}
            >
              <option value="">Seleccionar medida</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.size}
                  {v.sides ? ` - ${v.sides}` : ""}
                  {v.paperType ? ` - ${v.paperType}` : ""}
                  {v.finish ? ` - ${v.finish}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">Nota</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              placeholder="Opcional"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Precio unitario</span>
              <strong>${unitPrice.toFixed(2)}</strong>
            </div>

            <div className="flex justify-between text-xl">
              <span className="font-bold">Total</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={addItem}
            disabled={!variantId}
            className="w-full bg-gray-900 text-white rounded-lg py-3 font-bold"
          >
            Add Item
          </button>
          <div className="border rounded-xl p-4 mt-4">
            <h3 className="font-bold mb-3">Sale Items</h3>

            {cart.map((item, index) => (
              <div key={index} className="flex justify-between py-2 border-b">
                <div>
                  <div className="font-semibold">{item.productName}</div>

                  <div className="text-xs text-gray-500">{item.size}</div>
                </div>

                <div>Qty {item.quantity}</div>

                <div className="font-bold">${item.total.toFixed(2)}</div>
              </div>
            ))}

            <div className="flex justify-between mt-4 text-xl font-bold">
              <span>Total</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>

            <button
              type="button"
              onClick={completeSale}
              disabled={cart.length === 0 || loading}
              className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg font-bold"
            >
              Complete Sale
            </button>
          </div>
        </form>

        <div className="lg:col-span-2 bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">
              Ventas recientes
            </h2>

            <div className="text-right">
              <p className="text-sm text-gray-500">Total mostrado</p>
              <p className="text-2xl font-bold">${shownTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Producto</th>
                  <th className="text-left p-3">Medida</th>
                  <th className="text-right p-3">Qty</th>
                  <th className="text-right p-3">Unit</th>
                  <th className="text-right p-3">Total</th>
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b">
                    <td className="p-3">
                      {new Date(sale.saleDate).toLocaleString()}
                    </td>

                    <td className="p-3">
                      {sale.product?.category} - {sale.product?.name}
                    </td>

                    <td className="p-3">
                      {sale.variant?.size}
                      {sale.variant?.sides ? ` / ${sale.variant.sides}` : ""}
                      {sale.variant?.paperType
                        ? ` / ${sale.variant.paperType}`
                        : ""}
                      {sale.variant?.finish ? ` / ${sale.variant.finish}` : ""}
                    </td>

                    <td className="p-3 text-right">{sale.quantity}</td>

                    <td className="p-3 text-right">
                      ${Number(sale.unitPrice).toFixed(2)}
                    </td>

                    <td className="p-3 text-right font-bold">
                      ${Number(sale.total).toFixed(2)}
                    </td>
                  </tr>
                ))}

                {sales.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-gray-400">
                      No hay ventas todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
