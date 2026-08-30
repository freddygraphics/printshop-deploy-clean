"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ProductBuilder from "@/components/products/ProductBuilder/index";

export default function NewProductPage() {
  const router = useRouter();

  const [productType, setProductType] = useState("standard");

  async function handleSave(product) {
    try {
      const configuratorType = productType === "standard" ? null : productType;

      const payload = {
        ...product,

        category: configuratorType,

        // Temporalmente seguimos usando templateType
        // hasta cambiar el schema por configuratorType
        templateType: configuratorType,

        defaultOptions: product.defaultOptions || product.configuration || {},
      };

      delete payload.configuration;

      console.log("PRODUCT CREATE PAYLOAD:", payload);

      const res = await fetch("/api/products/from-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseText = await res.text();

      let data = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          console.error("API returned non-JSON response:", responseText);
        }
      }

      if (!res.ok) {
        alert(data?.error || `Error saving product (${res.status})`);
        return;
      }

      router.push("/settings/products");
      router.refresh();
    } catch (err) {
      console.error("Unexpected product creation error:", err);

      alert(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8">
        <Link
          href="/settings/products"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Back to Products
        </Link>
      </div>

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="max-w-md">
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Product Type
          </label>

          <select
            value={productType}
            onChange={(event) => setProductType(event.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="standard">Standard Product</option>

            <option value="stickers">Stickers</option>

            <option value="apparel">Apparel</option>

            <option value="raffle-tickets">Raffle Tickets</option>

            <option value="yard-signs">Yard Signs</option>

            <option value="truck-lettering">Truck Lettering</option>
          </select>

          <p className="mt-2 text-xs text-gray-500">
            This determines which configurator is used for the product.
          </p>
        </div>
      </section>

      <ProductBuilder
        mode="new"
        productType={productType}
        templateType={productType === "standard" ? null : productType}
        onSave={handleSave}
      />
    </main>
  );
}
