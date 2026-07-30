"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import InlineProductEditor from "@/components/InlineProductEditor";
const normalizeOptions = (options) => {
  if (!options || Array.isArray(options)) return {};
  return options;
};
export default function ProductOptionsPage() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/products/${id}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Product not found");
      }

      setProduct(data);

      setItem({
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()),

        productId: data.id,
        product: data,

        name: data.name,
        qty: 1,
        unitPrice: 0,
        total: 0,

        customFields: data.customFields || data.template?.fields || null,

        options: (() => {
          const configuration = normalizeOptions(
            data.defaultOptions ?? data.template?.options ?? {},
          );

          const dynamicOptions = {};

          for (const group of configuration.productOptions || []) {
            const groupKey = group.key || group.name;

            if (!groupKey) continue;

            const defaultValue = (group.values || []).find(
              (value) => value.default === true,
            );

            if (defaultValue) {
              dynamicOptions[groupKey] =
                defaultValue.key || defaultValue.value || defaultValue.label;
            }
          }

          return {
            ...configuration,
            dynamicOptions,
          };
        })(),

        _expanded: true,
      });
    } catch (err) {
      console.error("Error loading product:", err);
      setError(err.message || "The product could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  function handleProductChange(patch) {
    setItem((current) => {
      if (!current) return current;

      return {
        ...current,
        ...patch,

        options: {
          ...(current.options || {}),
          ...(patch.options || {}),
        },
      };
    });
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-center text-gray-500">Loading product...</p>
      </main>
    );
  }

  if (error || !product || !item) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href="/products"
          className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error || "Product not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
      >
        <ArrowLeft size={18} />
        Back to Products
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

        {product.description && (
          <p className="mt-2 max-w-3xl text-gray-500">{product.description}</p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <InlineProductEditor
          product={product}
          data={item}
          onChange={handleProductChange}
          onClose={() => {}}
          autoCalculateOnMount={true}
        />
      </div>
    </main>
  );
}
