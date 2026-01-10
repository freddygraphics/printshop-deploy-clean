"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProductViewPage({ params }) {
  const { id } = params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load product
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading…</div>;

  if (!product)
    return (
      <div className="p-10 text-center text-red-500">Product not found</div>
    );

  const cfg = product.customFields || {};
  const opts = product.defaultOptions || {};

  return (
    <main className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <Link href="/products" className="text-blue-600">
          <ArrowLeft className="inline mr-1" /> Back
        </Link>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow">
        <p className="text-gray-600 mb-4">
          {product.description || "No description"}
        </p>

        <p className="font-medium mb-6">Base Price: ${product.price}</p>

        {/* QUANTITIES */}
        {cfg.rows && (
          <section className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Quantities</h2>
            <ul className="ml-4 list-disc">
              {cfg.rows.map((r, i) => (
                <li key={i}>
                  {r.qty} — ${r.price}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FINISH */}
        {cfg.finish && (
          <section className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Finish</h2>
            <ul className="ml-4 list-disc">
              {cfg.finish.map((f, i) => (
                <li key={i}>
                  {f.name} (+${f.price})
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* SIDES */}
        {cfg.sides && (
          <section className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Sides</h2>
            <ul className="ml-4 list-disc">
              {cfg.sides.map((s, i) => (
                <li key={i}>
                  {s.name} (+${s.price})
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* DESIGN */}
        {cfg.design && (
          <section className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Design</h2>
            <ul className="ml-4 list-disc">
              {cfg.design.map((d, i) => (
                <li key={i}>
                  {d.name} (+${d.price})
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CORNERS */}
        {cfg.corners && (
          <section className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Corners</h2>
            <ul className="ml-4 list-disc">
              {cfg.corners.map((c, i) => (
                <li key={i}>
                  {c.name} (+${c.price})
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CHECKBOX OPTIONS */}
        {opts && Object.keys(opts).length > 0 && (
          <section className="mb-6">
            <h2 className="font-semibold text-lg mb-2">Default Options</h2>
            <ul className="ml-4 list-disc">
              {Object.entries(opts).map(([key, val]) => (
                <li key={key}>
                  {key}: {val ? "Enabled" : "Disabled"}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
